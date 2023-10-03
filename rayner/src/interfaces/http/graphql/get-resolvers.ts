/* eslint-disable unicorn/no-null */
import EventEmitter from 'node:events';

import { FastifyInstance } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GraphQLUpload from 'graphql-upload';
import { IResolvers, MercuriusContext } from 'mercurius';
import { Logger } from 'pino';

import { toGraphQlDevice } from './mappers/to-graphql-device';
import { toGraphQlSubscriptionDevice } from './mappers/to-graphql-subscription-device';
import { toGraphQlUser } from './mappers/to-graphql-user';
import { SubscriptionDeviceType, SubscriptionTopic } from './subscription';

import { createUser } from '../../../application-services/security/create-user';
import { deleteUser } from '../../../application-services/security/delete-user';
import { refreshAccessToken } from '../../../application-services/security/refresh-access-token';
import { setPassword } from '../../../application-services/security/set-password';
import { setRole } from '../../../application-services/security/set-role';
import { signIn } from '../../../application-services/security/sign-in';
import { signOut } from '../../../application-services/security/sign-out';
import { activateTwoFa } from '../../../application-services/security/two-fa/activate-two-fa';
import { confirmTwoFa } from '../../../application-services/security/two-fa/confirm-two-fa';
import { deactivateTwoFa } from '../../../application-services/security/two-fa/deactivate-two-fa';
import { verifyTwoFa } from '../../../application-services/security/two-fa/verify-two-fa';
import { EventBus } from '../../../domain/event-bus';
import { JwtPayload } from '../../../domain/user';
import { ErrorCode, ErrorMessage, ErrorType } from '../../../helpers/error-type';
import { Config } from '../../../infrastructure/config';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { IRefreshSessionRepository } from '../../../ports/refresh-session-repository';
import { IUserRepository } from '../../../ports/user-repository';
import { IWirenboardDeviceRepository } from '../../../ports/wirenboard-device-repository';

export type GetResolvers = {
  fastify: FastifyInstance;
  config: Config;
  logger: Logger;
  eventBus: EventEmitter;
  userRepository: IUserRepository;
  refreshSessionRepository: IRefreshSessionRepository;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const getResolvers = ({
  fastify,
  config,
  logger,
  eventBus,
  userRepository,
  refreshSessionRepository,
  wirenboardDeviceRepository,
}: GetResolvers): IResolvers => {
  return {
    Upload: GraphQLUpload,
    Query: {
      getUser: async (parent, { input }, context: MercuriusContext, info) => {
        if (!input.id && !context.auth?.userId) {
          logger.error({ context }, 'To get current use, you must have a user ID in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const user = await userRepository.get(input.id ?? context.auth?.userId ?? '');

        if (user instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return toGraphQlUser(user);
      },

      getUsers: async (parent, { input }, context: MercuriusContext, info) => {
        const users = await userRepository.find({
          pagination: {
            limit: input.pagination.limit ?? 25,
            page: input.pagination.page ?? 1,
          },
        });

        if (users instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return {
          admins: users.items.map((user) => toGraphQlUser(user)),
          pagination: users.pagination,
        };
      },

      getMacrosWireframes: async (parent, _, context: MercuriusContext, info) => {
        return [];
      },
    },
    Mutation: {
      signIn: async (parent, { input }, context: MercuriusContext, info) => {
        const singInResult = await signIn({
          config,
          logger,
          userRepository,
          captcha: input.captchaCheck,
          email: input.email,
          password: input.password,
        });

        if (singInResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        if (singInResult.user) {
          if (singInResult.user.isTwoFaActivated) {
            return {
              accessToken: undefined,
              is2FaActive: true,
              error: singInResult.error,
            };
          }

          const accessToken = fastify.jwt.sign(
            {
              userId: singInResult.user.id,
              role: singInResult.user.role,
              onlyForActivateTwoFa: true,
            } as JwtPayload,
            {
              expiresIn: config.fastify.auth.tokenTtlMs,
            },
          );

          return {
            accessToken,
            is2FaActive: false,
            error: singInResult.error,
          };
        }

        return {
          is2FaActive: undefined,
          accessToken: undefined,
          error: singInResult.error,
        };
      },

      signOut: async (parent, _, context: MercuriusContext, info) => {
        if (!context.auth?.refreshToken) {
          logger.error({ context }, 'To sign out, you must have a "refreshToken" in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const signOutResult = signOut({
          refreshSessionRepository,
          logger,
          refreshToken: context.auth?.refreshToken,
        });

        if (signOutResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      createUser: async (parent, { input }, context, info) => {
        const createUserResult = await createUser({
          logger,
          config,
          userRepository,
          email: input.email,
          name: input.name,
          role: input.role,
          password: input.password,
        });

        if (createUserResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        const { user, error } = createUserResult;

        return {
          user: user ? toGraphQlUser(user) : undefined,
          error,
        };
      },

      deleteUser: async (parent, { input }, context, info) => {
        const deleteUserResult = deleteUser({
          logger,
          userRepository,
          userId: input.id,
        });

        if (deleteUserResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      setPassword: async (parent, { input }, context, info) => {
        const setPasswordResult = setPassword({
          config,
          userRepository,
          userId: input.id,
          password: input.password,
        });

        if (setPasswordResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      setRole: async (parent, { input }, context, info) => {
        const setRoleResult = await setRole({
          userRepository,
          userId: input.id,
          role: input.role,
        });

        if (setRoleResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      activateTwoFa: async (parent, _, context: MercuriusContext, info) => {
        if (!context.auth?.userId) {
          logger.error({ context }, 'To activate TwoFa, you must have a user ID in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const codes = await activateTwoFa({
          userRepository,
          logger,
          userId: context.auth?.userId,
        });

        if (codes instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return {
          qr: codes.qr,
          code: codes.code,
        };
      },

      confirmTwoFa: async (parent, { input }, context: MercuriusContext, info) => {
        if (!context.auth?.userId) {
          logger.error({ context }, 'To confirm TwoFa, you must have a user ID in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const confirmation = await confirmTwoFa({
          logger,
          userRepository,
          userId: context.auth?.userId,
          totp: input.totp,
        });

        if (confirmation instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      verifyTwoFa: async (parent, { input }, context: MercuriusContext, info) => {
        if (!context.auth?.fingerprint) {
          logger.error({ context }, 'To verify TwoFa, you must have a fingerprint in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const verifyTwoFaResult = await verifyTwoFa({
          userRepository,
          refreshSessionRepository,
          logger,
          fingerprint: context.auth?.fingerprint,
          email: input.email,
          totp: input.totp,
        });

        if (verifyTwoFaResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        context.reply.cookie('refreshToken', verifyTwoFaResult.refreshSession.refreshToken, {
          httpOnly: true,
          maxAge: Number(verifyTwoFaResult.refreshSession.expiresIn),
        });

        const accessToken = fastify.jwt.sign(
          {
            userId: verifyTwoFaResult.user.id,
            role: verifyTwoFaResult.user.role,
            onlyForActivateTwoFa: false,
          } as JwtPayload,
          {
            expiresIn: config.fastify.auth.tokenTtlMs,
          },
        );

        return { accessToken };
      },

      deactivateTwoFa: async (parent, { input }, context: MercuriusContext, info) => {
        if (!context.auth?.userId) {
          logger.error({ context }, 'To deactivate TwoFa, you must have a user ID in the authentication context 🚨');

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const deactivateTwoFaResult = await deactivateTwoFa({
          logger,
          userRepository,
          userId: context.auth?.userId,
          totp: input.totp,
        });

        if (deactivateTwoFaResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      refreshAccessToken: async (parent, _, context: MercuriusContext, info) => {
        if (!context.auth?.fingerprint) {
          logger.error(
            { context },
            'To refresh access token, you must have a "fingerprint" in the authentication context 🚨',
          );

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        if (!context.auth?.refreshToken) {
          logger.error(
            { context },
            'To refresh access token, you must have a "refreshToken" in the authentication context 🚨',
          );

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const refreshResult = await refreshAccessToken({
          logger,
          refreshSessionRepository,
          fingerprint: context.auth?.fingerprint,
          refreshToken: context.auth?.refreshToken,
        });

        if (refreshResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        context.reply.cookie('refreshToken', refreshResult.refreshSession.refreshToken, {
          httpOnly: true,
          maxAge: refreshResult.refreshSession.expiresIn.getTime(),
        });

        const accessToken = fastify.jwt.sign(
          {
            userId: refreshResult.user.id,
            role: refreshResult.user.role,
            onlyForActivateTwoFa: false,
          } as JwtPayload,
          {
            expiresIn: config.fastify.auth.tokenTtlMs,
          },
        );

        return { accessToken };
      },

      setControlValue: async (root, { input }, context) => {
        const hyperionDevice = await wirenboardDeviceRepository.setControlValue({
          deviceId: input.deviceId,
          controlId: input.controlId,
          value: input.value,
        });

        if (hyperionDevice instanceof Error) {
          throw hyperionDevice;
        }

        const control = hyperionDevice.controls.find(({ id }) => id === input.controlId);

        if (!control) {
          logger.error({ input, hyperionDevice }, 'Control not found 🚨');

          return toGraphQlDevice(hyperionDevice);
        }

        if (control.readonly) {
          logger.error({ input, hyperionDevice }, 'Control is readonly 🚨');

          return toGraphQlDevice(hyperionDevice);
        }

        if (!control.topic) {
          logger.error({ input, hyperionDevice }, 'Control is not readonly, but topic is empty 🚨');

          return toGraphQlDevice(hyperionDevice);
        }

        emitWirenboardMessage({ eventBus, topic: control.topic, message: input.value });

        eventBus.emit(
          EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
          toGraphQlSubscriptionDevice({
            devices: [hyperionDevice],
            type: SubscriptionDeviceType.VALUE_IS_SET,
            error: {
              code: ErrorCode.ALL_RIGHT,
              message: ErrorMessage.ALL_RIGHT,
            },
          }),
        );

        return toGraphQlDevice(hyperionDevice);
      },
      markupDevice: async (root, { input }, context) => {
        const hyperionDevice = await wirenboardDeviceRepository.markupDevice({
          deviceId: input.deviceId,
          labels: input.labels,
          markup: input.markup,
        });

        if (hyperionDevice instanceof Error) {
          throw hyperionDevice;
        }

        eventBus.emit(
          EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
          toGraphQlSubscriptionDevice({
            devices: [hyperionDevice],
            type: SubscriptionDeviceType.MARKED_UP,
            error: {
              code: ErrorCode.ALL_RIGHT,
              message: ErrorMessage.ALL_RIGHT,
            },
          }),
        );

        return toGraphQlDevice(hyperionDevice);
      },
      markupControl: async (root, { input }, context) => {
        const hyperionDevice = await wirenboardDeviceRepository.markupControl({
          deviceId: input.deviceId,
          controlId: input.controlId,
          labels: input.labels,
          markup: input.markup,
        });

        if (hyperionDevice instanceof Error) {
          throw hyperionDevice;
        }

        eventBus.emit(
          EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
          toGraphQlSubscriptionDevice({
            devices: [hyperionDevice],
            type: SubscriptionDeviceType.MARKED_UP,
            error: {
              code: ErrorCode.ALL_RIGHT,
              message: ErrorMessage.ALL_RIGHT,
            },
          }),
        );

        return toGraphQlDevice(hyperionDevice);
      },
    },
    Subscription: {
      device: {
        subscribe: async (root, _, { pubsub }) => {
          const hyperionDevices = await wirenboardDeviceRepository.getAll();

          if (hyperionDevices instanceof Error) {
            throw hyperionDevices;
          }

          const subscribe = await pubsub.subscribe(SubscriptionTopic.DEVICE);

          eventBus.emit(
            EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
            toGraphQlSubscriptionDevice({
              devices: hyperionDevices,
              type: SubscriptionDeviceType.CONNECTION_ESTABLISHED,
              error: {
                code: ErrorCode.ALL_RIGHT,
                message: ErrorMessage.ALL_RIGHT,
              },
            }),
          );

          return subscribe;
        },
      },
      macros: {
        subscribe: async (root, _, { pubsub }) => {
          return await pubsub.subscribe(SubscriptionTopic.MACROS);
        },
      },
    },
  };
};

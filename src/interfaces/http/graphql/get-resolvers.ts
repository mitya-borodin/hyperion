/* eslint-disable unicorn/no-null */
import EventEmitter from 'node:events';

import debug from 'debug';
import { FastifyInstance } from 'fastify';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { IResolvers, MercuriusContext } from 'mercurius';

import { emitHyperionStateUpdate } from '../../../application-services/helpers/emit-hyperion-state-update';
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
import { MacrosEngine } from '../../../domain/macros/engine';
import { getControlId } from '../../../domain/macros/get-control-id';
import { macrosShowcase } from '../../../domain/macros/showcase';
import { JwtPayload } from '../../../domain/user';
import { ErrorCode, ErrorMessage, ErrorType } from '../../../helpers/error-type';
import { Config } from '../../../infrastructure/config';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { IHyperionDeviceRepository } from '../../../ports/hyperion-device-repository';
import { IRefreshSessionRepository } from '../../../ports/refresh-session-repository';
import { IUserRepository } from '../../../ports/user-repository';

import { emitGqlDeviceSubscriptionEvent } from './helpers/emit-gql-device-subscription-event';
import { emitGqlMacrosSubscriptionEvent } from './helpers/emit-gql-macros-subscription-event';
import { toGraphQlDevice } from './mappers/to-graphql-device';
import { toGraphQlMacros } from './mappers/to-graphql-macros';
import { toGraphQlSubscriptionDevice } from './mappers/to-graphql-subscription-device';
import { toGraphQlSubscriptionMacros } from './mappers/to-graphql-subscription-macros';
import { toGraphQlUser } from './mappers/to-graphql-user';
import { SubscriptionDeviceType, SubscriptionMacrosType, SubscriptionTopic } from './subscription';

const logger = debug('hyperion-get-resolvers');

export type GetResolvers = {
  fastify: FastifyInstance;
  config: Config;
  eventBus: EventEmitter;
  userRepository: IUserRepository;
  refreshSessionRepository: IRefreshSessionRepository;
  hyperionDeviceRepository: IHyperionDeviceRepository;
  macrosEngine: MacrosEngine;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const getResolvers = ({
  fastify,
  config,
  eventBus,
  userRepository,
  refreshSessionRepository,
  hyperionDeviceRepository,
  macrosEngine,
}: GetResolvers): IResolvers => {
  return {
    Upload: GraphQLUpload,
    Query: {
      getUser: async (parent, { input }, context: MercuriusContext, info) => {
        if (!input.id && !context.auth?.userId) {
          logger('To get current use, you must have a user ID in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

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

      getMacrosShowcase: async (parent, _, context: MercuriusContext, info) => {
        return Object.entries(macrosShowcase).map(([type, { name, description }]) => {
          return {
            type,
            name,
            description,
          };
        });
      },
    },
    Mutation: {
      /**
       * ! USER
       */
      signIn: async (parent, { input }, context: MercuriusContext, info) => {
        const singInResult = await signIn({
          config,
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
              isTwoFaActivated: true,
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
            isTwoFaActivated: false,
            error: singInResult.error,
          };
        }

        return {
          isTwoFaActivated: undefined,
          accessToken: undefined,
          error: singInResult.error,
        };
      },

      signOut: async (parent, _, context: MercuriusContext, info) => {
        if (!context.auth?.refreshToken) {
          logger('To sign out, you must have a "refreshToken" in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const signOutResult = signOut({
          refreshSessionRepository,
          refreshToken: context.auth?.refreshToken,
        });

        if (signOutResult instanceof Error) {
          throw new TypeError(ErrorType.INVALID_ARGUMENTS);
        }

        return null;
      },

      createUser: async (parent, { input }, context, info) => {
        const createUserResult = await createUser({
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
          logger('To activate TwoFa, you must have a user ID in the authentication context 🚨');
          logger(JSON.stringify({ context: context.auth }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const codes = await activateTwoFa({
          userRepository,
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
          logger('To confirm TwoFa, you must have a user ID in the authentication context 🚨');
          logger(JSON.stringify({ context: context.auth }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const confirmation = await confirmTwoFa({
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
          logger('To verify TwoFa, you must have a fingerprint in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const verifyTwoFaResult = await verifyTwoFa({
          userRepository,
          refreshSessionRepository,
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
          logger('To deactivate TwoFa, you must have a user ID in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const deactivateTwoFaResult = await deactivateTwoFa({
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
          logger('To refresh access token, you must have a "fingerprint" in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        if (!context.auth?.refreshToken) {
          logger('To refresh access token, you must have a "refreshToken" in the authentication context 🚨');
          logger(JSON.stringify({ context }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const refreshResult = await refreshAccessToken({
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

      /**
       * ! HARDWARE
       */
      setControlValue: async (root, { input }, context) => {
        const hyperionStateUpdate = await hyperionDeviceRepository.setControlValue({
          deviceId: input.deviceId,
          controlId: input.controlId,
          value: input.value,
        });

        if (hyperionStateUpdate instanceof Error) {
          throw hyperionStateUpdate;
        }

        const { devices, controls } = hyperionStateUpdate;

        const device = devices.get(input.deviceId);

        if (!device) {
          logger('Device not found 🚨');
          logger(JSON.stringify({ input }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const control = controls.get(getControlId(input));

        if (!control) {
          logger('Control not found 🚨');
          logger(JSON.stringify({ input, device }, null, 2));

          return toGraphQlDevice(device);
        }

        if (control.readonly) {
          logger('Control is readonly 🚨');
          logger(JSON.stringify({ input, device }, null, 2));

          return toGraphQlDevice(device);
        }

        if (!control.topic) {
          logger('Control is not readonly, but topic is empty 🚨');
          logger(JSON.stringify({ input, device }, null, 2));

          return toGraphQlDevice(device);
        }

        emitHyperionStateUpdate({ eventBus, hyperionStateUpdate });
        emitWirenboardMessage({ eventBus, topic: control.topic, message: input.value });
        emitGqlDeviceSubscriptionEvent({ eventBus, hyperionDevice: device, type: SubscriptionDeviceType.VALUE_IS_SET });

        return toGraphQlDevice(device);
      },
      markupDevice: async (root, { input }, context) => {
        const hyperionStateUpdate = await hyperionDeviceRepository.markupDevice({
          deviceId: input.deviceId,
          labels: input.labels,
          markup: input.markup,
        });

        if (hyperionStateUpdate instanceof Error) {
          throw hyperionStateUpdate;
        }

        const device = hyperionStateUpdate.devices.get(input.deviceId);

        if (!device) {
          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        emitHyperionStateUpdate({ eventBus, hyperionStateUpdate });
        emitGqlDeviceSubscriptionEvent({
          eventBus,
          hyperionDevice: device,
          type: SubscriptionDeviceType.MARKED_UP,
        });

        return toGraphQlDevice(device);
      },
      markupControl: async (root, { input }, context) => {
        const hyperionStateUpdate = await hyperionDeviceRepository.markupControl({
          deviceId: input.deviceId,
          controlId: input.controlId,
          labels: input.labels,
          markup: input.markup,
        });

        if (hyperionStateUpdate instanceof Error) {
          throw hyperionStateUpdate;
        }

        const device = hyperionStateUpdate.devices.get(input.deviceId);

        if (!device) {
          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        emitHyperionStateUpdate({ eventBus, hyperionStateUpdate });
        emitGqlDeviceSubscriptionEvent({ eventBus, hyperionDevice: device, type: SubscriptionDeviceType.MARKED_UP });

        return toGraphQlDevice(device);
      },

      /**
       * ! MACROS
       */
      setupMacros: async (root, { input }, context) => {
        const macros = await macrosEngine.setup(input);

        if (macros instanceof Error) {
          throw macros;
        }

        emitGqlMacrosSubscriptionEvent({
          eventBus,
          type: input.id ? SubscriptionMacrosType.UPDATE : SubscriptionMacrosType.SETUP,
          macros,
        });

        const error = {
          code: ErrorCode.ALL_RIGHT,
          message: ErrorMessage.ALL_RIGHT,
        };

        return {
          macros: toGraphQlMacros(macros),
          error,
        };
      },
      destroyMacros: async (root, { input }, context) => {
        if (!input?.id) {
          logger('To destroy the macro, you must specify the ID 🚨');
          logger(JSON.stringify({ input }, null, 2));

          throw new Error(ErrorType.INVALID_ARGUMENTS);
        }

        const macros = await macrosEngine.destroy(input.id);

        if (macros instanceof Error) {
          throw macros;
        }

        emitGqlMacrosSubscriptionEvent({
          eventBus,
          macros,
          type: SubscriptionMacrosType.DESTROY,
        });

        const error = {
          code: ErrorCode.ALL_RIGHT,
          message: ErrorMessage.ALL_RIGHT,
        };

        return { error };
      },
    },
    Subscription: {
      device: {
        subscribe: async (root, _, { pubsub }) => {
          const hyperionState = await hyperionDeviceRepository.getHyperionState();

          if (hyperionState instanceof Error) {
            throw hyperionState;
          }

          const subscribe = await pubsub.subscribe(SubscriptionTopic.DEVICE);

          eventBus.emit(
            EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
            toGraphQlSubscriptionDevice({
              devices: [...hyperionState.devices.values()],
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
          const subscribe = await pubsub.subscribe(SubscriptionTopic.MACROS);

          eventBus.emit(
            EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
            toGraphQlSubscriptionMacros({
              macros: macrosEngine.getList(),
              type: SubscriptionMacrosType.CONNECTION_ESTABLISHED,
              error: {
                code: ErrorCode.ALL_RIGHT,
                message: ErrorMessage.ALL_RIGHT,
              },
            }),
          );

          return subscribe;
        },
      },
    },
  };
};

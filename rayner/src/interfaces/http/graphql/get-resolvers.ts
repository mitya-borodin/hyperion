/* eslint-disable unicorn/no-null */
import EventEmitter from 'node:events';
import { Stream } from 'node:stream';
import util from 'node:util';

import { FastifyInstance } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GraphQLUpload from 'graphql-upload';
import { IResolvers } from 'mercurius';
import { Logger } from 'pino';

import { toGraphQlDevice } from './mappers/to-graphql-device';
import { toGraphQlSubscriptionDevice } from './mappers/to-graphql-subscription-device';
import { SubscriptionDeviceType, SubscriptionTopic } from './subscription';

import { EventBus } from '../../../domain/event-bus';
import { ErrorCode, ErrorMessage } from '../../../helpers/error-type';
import { Config } from '../../../infrastructure/config';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { IWirenboardDeviceRepository } from '../../../ports/wirenboard-device-repository';

const pipeline = util.promisify(Stream.pipeline);

export type GetResolvers = {
  fastify: FastifyInstance;
  config: Config;
  logger: Logger;
  eventBus: EventEmitter;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const getResolvers = ({
  fastify,
  config,
  logger,
  eventBus,
  wirenboardDeviceRepository,
}: GetResolvers): IResolvers => {
  return {
    Upload: GraphQLUpload,
    Query: {},
    Mutation: {
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

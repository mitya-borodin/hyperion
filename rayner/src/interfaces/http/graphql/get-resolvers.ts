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

import { toGraphQlSubscriptionDevice } from './mappers/to-graphql-subscription-device';
import { SubscriptionDeviceType, SubscriptionTopic } from './subscription';

import { EventBus } from '../../../domain/event-bus';
import { ErrorCode, ErrorMessage } from '../../../helpers/error-type';
import { Config } from '../../../infrastructure/config';
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
    Mutation: {},
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

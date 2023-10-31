/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable no-constant-condition */
import EventEmitter from 'node:events';

import { PrismaClient } from '@prisma/client';
import { forever } from 'abort-controller-x';

import { runCollectWirenboardDeviceData } from './application-services/apply-wirenboard-device';
import { EventBus } from './domain/event-bus';
import { MacrosEngine } from './domain/macroses/macros-engine';
import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { waitSeedingComplete } from './infrastructure/postgres/repository/helpers/wait-seeding-complete';
import { RefreshSessionRepository } from './infrastructure/postgres/repository/refresh-session-repository';
import { UserRepository } from './infrastructure/postgres/repository/user-repository';
import { WirenboardDeviceRepository } from './infrastructure/postgres/repository/wirenboard-device-repository';
import { createHttpInterface } from './interfaces/http';

EventEmitter.defaultMaxListeners = 100;

export const run = () => {
  entrypoint(async ({ signal, logger, defer }) => {
    const prismaClient = new PrismaClient();

    await waitSeedingComplete({ signal, logger, prismaClient });

    const eventBus = new EventEmitter();

    const userRepository = new UserRepository({ config, logger, client: prismaClient });
    const refreshSessionRepository = new RefreshSessionRepository({ logger, client: prismaClient });
    const wirenboardDeviceRepository = new WirenboardDeviceRepository({ logger, client: prismaClient });
    const macrosEngine = new MacrosEngine({ logger, eventBus });

    macrosEngine.start();

    defer(() => macrosEngine.stop());

    const wirenboard = await runWirenboard({ config, logger: logger.child({ name: 'wirenboard' }), eventBus });

    defer(() => wirenboard.stop());

    const stopCollectWirenboardDeviceData = runCollectWirenboardDeviceData({
      logger,
      wirenboardDeviceRepository,
      eventBus,
    });

    defer(() => stopCollectWirenboardDeviceData());

    const fastify = await createHttpInterface({
      config,
      logger: logger.child({ name: 'http-server' }),
      eventBus,
      userRepository,
      refreshSessionRepository,
      wirenboardDeviceRepository,
      macrosEngine,
    });

    await fastify.listen({
      host: config.fastify.host,
      port: config.fastify.port,
    });

    eventBus.on(EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT, (event) => {
      // logger.debug({ event }, 'Send event to graphQl subscription 🚀');

      fastify.graphql.pubsub.publish(event);
    });

    defer(() => {
      eventBus.removeAllListeners();
    });
    defer(() => fastify.close());
    defer(() => prismaClient.$disconnect());

    await forever(signal);
  });
};

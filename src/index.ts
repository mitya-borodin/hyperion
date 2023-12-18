/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable no-constant-condition */
import EventEmitter from 'node:events';
import { exit } from 'node:process';

import { PrismaClient } from '@prisma/client';
import { forever } from 'abort-controller-x';

import { runCollectWirenboardDeviceData } from './application-services/apply-wirenboard-device';
import { EventBus } from './domain/event-bus';
import { MacrosEngine } from './domain/macroses/macros-engine';
import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { waitSeedingComplete } from './infrastructure/postgres/repository/helpers/wait-seeding-complete';
import { MacrosSettingsRepository } from './infrastructure/postgres/repository/macros-settings-repository';
import { RefreshSessionRepository } from './infrastructure/postgres/repository/refresh-session-repository';
import { UserRepository } from './infrastructure/postgres/repository/user-repository';
import { WirenboardDeviceRepository } from './infrastructure/postgres/repository/wirenboard-device-repository';
import { createHttpInterface } from './interfaces/http';

EventEmitter.defaultMaxListeners = 100;

export const run = () => {
  entrypoint(async ({ signal, defer }) => {
    const prismaClient = new PrismaClient();

    await waitSeedingComplete({ signal, prismaClient });

    const eventBus = new EventEmitter();

    const userRepository = new UserRepository({ config, client: prismaClient });
    const refreshSessionRepository = new RefreshSessionRepository({ client: prismaClient });
    const wirenboardDeviceRepository = new WirenboardDeviceRepository({ client: prismaClient });
    const macrosSettingsRepository = new MacrosSettingsRepository({ client: prismaClient });
    const macrosEngine = new MacrosEngine({ eventBus, wirenboardDeviceRepository, macrosSettingsRepository });

    const engine = await macrosEngine.start();

    if (engine instanceof Error) {
      exit(1);
    }

    defer(() => macrosEngine.stop());

    const wirenboard = await runWirenboard({ config, eventBus });

    defer(() => wirenboard.stop());

    const stopCollectWirenboardDeviceData = runCollectWirenboardDeviceData({
      wirenboardDeviceRepository,
      eventBus,
    });

    defer(() => stopCollectWirenboardDeviceData());

    const fastify = await createHttpInterface({
      config,
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

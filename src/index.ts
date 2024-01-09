/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable no-constant-condition */
import EventEmitter from 'node:events';
import { exit } from 'node:process';

import { PrismaClient } from '@prisma/client';
import { forever } from 'abort-controller-x';

import { runCollectHardwareDevice } from './application-services/run-collect-hardware-device';
import { EventBus } from './domain/event-bus';
import { MacrosEngine } from './domain/macroses/macros-engine';
import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { runZigbee2mqtt } from './infrastructure/external-resource-adapters/zigbe2mqtt';
import { HyperionDeviceRepository } from './infrastructure/postgres/repository/hardware-device-repository';
import { waitSeedingComplete } from './infrastructure/postgres/repository/helpers/wait-seeding-complete';
import { MacrosSettingsRepository } from './infrastructure/postgres/repository/macros-settings-repository';
import { RefreshSessionRepository } from './infrastructure/postgres/repository/refresh-session-repository';
import { UserRepository } from './infrastructure/postgres/repository/user-repository';
import { createHttpInterface } from './interfaces/http';

EventEmitter.defaultMaxListeners = 100;

export const run = () => {
  entrypoint(async ({ signal, defer }) => {
    const prismaClient = new PrismaClient();

    await waitSeedingComplete({ signal, prismaClient });

    const eventBus = new EventEmitter();

    const userRepository = new UserRepository({ config, client: prismaClient });
    const refreshSessionRepository = new RefreshSessionRepository({ client: prismaClient });
    const hyperionDeviceRepository = new HyperionDeviceRepository({ client: prismaClient });
    const macrosSettingsRepository = new MacrosSettingsRepository({ client: prismaClient });
    const macrosEngine = new MacrosEngine({ eventBus, hyperionDeviceRepository, macrosSettingsRepository });

    /**
     * ! RUN MACROS ENGINE
     */
    const engine = await macrosEngine.start();

    if (engine instanceof Error) {
      exit(1);
    }

    defer(() => macrosEngine.stop());

    /**
     * ! RUN ZIGBEE_2_MQTT
     */
    const zigbee2mqtt = await runZigbee2mqtt({ config, eventBus, hyperionDeviceRepository });

    if (zigbee2mqtt instanceof Error) {
      exit(1);
    }

    defer(() => zigbee2mqtt.stop());

    /**
     * ! RUN WIRENBOARD
     */
    const wirenboard = await runWirenboard({ config, eventBus });

    defer(() => wirenboard.stop());

    /**
     * ! RUN COLLECT HARDWARE DEVICE
     */
    const stopCollectHardwareDevice = runCollectHardwareDevice({
      hyperionDeviceRepository,
      eventBus,
    });

    defer(() => stopCollectHardwareDevice());

    const fastify = await createHttpInterface({
      config,
      eventBus,
      userRepository,
      refreshSessionRepository,
      hyperionDeviceRepository,
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

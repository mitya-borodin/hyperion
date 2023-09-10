/* eslint-disable no-constant-condition */
import { PrismaClient } from '@prisma/client';
import { forever } from 'abort-controller-x';

import { runCollectWirenboardDeviceData } from './application-services/apply-wirenboard-device';
import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { waitSeedingComplete } from './infrastructure/postgres/repository/helpers/wait-seeding-complete';
import { WirenboardDeviceRepository } from './infrastructure/postgres/repository/wirenboard-device-repository';
import { createHttpInterface } from './interfaces/http';

export const run = () => {
  entrypoint(async ({ signal, logger, defer }) => {
    const prismaClient = new PrismaClient();

    await waitSeedingComplete({ signal, logger, prismaClient });

    const wirenboardDeviceRepository = new WirenboardDeviceRepository({ logger, client: prismaClient });

    const wirenboard = await runWirenboard({ config, logger: logger.child({ name: 'wirenboard' }) });

    defer(() => wirenboard.stop());

    const stopCollectWirenboardDeviceData = runCollectWirenboardDeviceData({
      logger,
      pubSub: wirenboard.pubSub,
      wirenboardDeviceRepository,
    });

    defer(() => stopCollectWirenboardDeviceData());

    const fastify = await createHttpInterface({
      config,
      logger: logger.child({ name: 'http-server' }),
    });

    await fastify.listen({
      host: config.fastify.host,
      port: config.fastify.port,
    });

    defer(() => fastify.close());
    defer(() => prismaClient.$disconnect());

    await forever(signal);
  });
};

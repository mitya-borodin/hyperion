/* eslint-disable no-constant-condition */
import { forever } from 'abort-controller-x';
import { MongoClient, ServerApiVersion } from 'mongodb';

import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { createHttpInterface } from './interfaces/http';

entrypoint(async ({ signal, logger, defer }) => {
  const mongoClient = new MongoClient(config.mongodbConnectionUrl, {
    appName: config.appName,
    writeConcern: {
      w: 'majority',
    },
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    heartbeatFrequencyMS: 5000,
  });

  await mongoClient.connect();

  const wirenboard = await runWirenboard({ config, logger: logger.child({ name: 'wirenboard' }) });

  if (wirenboard instanceof Error) {
    throw wirenboard;
  }

  defer(() => wirenboard.stop());

  const fastify = await createHttpInterface({
    config,
    logger: logger.child({ name: 'http-server' }),
  });

  await fastify.listen({
    host: config.fastify.host,
    port: config.fastify.port,
  });

  defer(() => fastify.close());
  defer(() => mongoClient.close());

  await forever(signal);
});

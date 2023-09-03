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

  const myDB = mongoClient.db('wirenboard');
  const myColl = myDB.collection('devices');

  const document = { name: 'Neapolitan pizza', shape: 'round' };
  const result = await myColl.insertOne(document);

  console.log(`A document was inserted with the _id: ${result.insertedId}`);

  const { stopWirenboard } = await runWirenboard({ config });

  defer(() => stopWirenboard());

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

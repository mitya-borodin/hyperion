/* eslint-disable no-constant-condition */
import { forever } from 'abort-controller-x';

import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { createHttpInterface } from './interfaces/http';

entrypoint(async ({ signal, logger, defer }) => {
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

  await forever(signal);
});

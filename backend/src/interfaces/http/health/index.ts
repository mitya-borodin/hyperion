import { FastifyInstance } from 'fastify';
import { Logger } from 'pino';

import { getHealth } from './health-controller';

type RouterParameters = {
  logger: Logger;
};

export const health = async function (fastify: FastifyInstance, parameters: RouterParameters): Promise<void> {
  fastify.get('/alive', { schema: undefined }, getHealth({ ...parameters, fastify }));
};

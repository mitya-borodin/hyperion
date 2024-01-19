import { FastifyInstance } from 'fastify';

import { getHealth } from './health-controller';

export const health = async function (fastify: FastifyInstance): Promise<void> {
  fastify.get('/alive', { schema: undefined }, getHealth());
};

import { FastifyInstance } from 'fastify';

import { health } from './health';

export const routerFastifyPlugin = async (fastify: FastifyInstance): Promise<void> => {
  fastify.register(health, { prefix: 'health' });
};

import { FastifyInstance } from 'fastify';

import { Config } from '../../infrastructure/config';

import { health } from './health';

type RouterParameters = {
  config: Config;
};

export const routerFastifyPlugin = async (fastify: FastifyInstance, parameters: RouterParameters): Promise<void> => {
  fastify.register(health, { prefix: 'health' });
};

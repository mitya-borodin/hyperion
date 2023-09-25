import { FastifyInstance } from 'fastify';
import { Logger } from 'pino';

import { Config } from '../../infrastructure/config';

import { health } from './health';

type RouterParameters = {
  logger: Logger;
  config: Config;
};

export const routerFastifyPlugin = async (fastify: FastifyInstance, parameters: RouterParameters): Promise<void> => {
  fastify.register(health, { prefix: 'health', logger: parameters.logger });
};

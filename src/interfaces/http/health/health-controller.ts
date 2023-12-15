import debug from 'debug';
import { FastifyReply, FastifyRequest } from 'fastify';

const logger = debug('get-health');

export const getHealth = () => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    logger('Health check started 🎰');

    try {
      logger('Health is OK ✅');

      return reply.code(200).send();
    } catch (error) {
      logger('Health is not OK 🚨');
      logger(JSON.stringify({ error }, null, 2));

      return reply.code(500).send();
    }
  };
};

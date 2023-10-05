import { FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from 'pino';

type RouterParameters = {
  logger: Logger;
};

export const getHealth = ({ logger }: RouterParameters) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    logger.trace('Health check started 🎰');

    try {
      logger.trace('Health is OK ✅');

      return reply.code(200).send();
    } catch (error) {
      logger.error(error, 'Health is not OK 🚨');

      return reply.code(500).send();
    }
  };
};

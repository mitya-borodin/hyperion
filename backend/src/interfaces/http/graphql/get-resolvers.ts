/* eslint-disable unicorn/no-null */
import { Stream } from 'node:stream';
import util from 'node:util';

import { FastifyInstance } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GraphQLUpload from 'graphql-upload';
import { IResolvers } from 'mercurius';
import { Logger } from 'pino';

import { Config } from '../../../infrastructure/config';

const pipeline = util.promisify(Stream.pipeline);

export type GetResolvers = {
  fastify: FastifyInstance;
  config: Config;
  logger: Logger;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const getResolvers = ({ fastify, config, logger }: GetResolvers): IResolvers => {
  return {
    Upload: GraphQLUpload,
    Query: {},
    Mutation: {},
    Subscription: {},
  };
};

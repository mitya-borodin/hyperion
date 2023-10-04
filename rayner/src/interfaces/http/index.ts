/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/prefer-module */
import EventEmitter from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Cookie from '@fastify/cookie';
import fastifyJWT from '@fastify/jwt';
import FastifyStatic from '@fastify/static';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import metricsPlugin from 'fastify-metrics';
import { fastifyRawBody } from 'fastify-raw-body';

import { getResolvers } from './graphql/get-resolvers';

import { GraphQLResolveInfo } from 'graphql';
import HttpStatusCodes from 'http-status-codes';

import { routerFastifyPlugin } from './router';

import Mercurius from 'mercurius';
import MercuriusAuth, { MercuriusAuthContext } from 'mercurius-auth';
import { codegenMercurius, gql } from 'mercurius-codegen';
import MercuriusGQLUpload from 'mercurius-upload';
import { Logger } from 'pino';

import { JwtPayload, UNKNOWN_USER_ID, UserRole } from '../../domain/user';
import { Config } from '../../infrastructure/config';
import { register } from '../../infrastructure/prometheus';
import { IRefreshSessionRepository } from '../../ports/refresh-session-repository';
import { IUserRepository } from '../../ports/user-repository';
import { IWirenboardDeviceRepository } from '../../ports/wirenboard-device-repository';

type CreateHttpInterfaceParameters = {
  config: Config;
  logger: Logger;
  eventBus: EventEmitter;
  userRepository: IUserRepository;
  refreshSessionRepository: IRefreshSessionRepository;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthContext = {
  fingerprint: string;
  refreshToken?: string;
  userId: string;
  role: UserRole;
  onlyForActivateTwoFa?: boolean;
};

export const createHttpInterface = async ({
  config,
  logger,
  eventBus,
  userRepository,
  refreshSessionRepository,
  wirenboardDeviceRepository,
}: CreateHttpInterfaceParameters): Promise<Promise<FastifyInstance>> => {
  const fastify = Fastify({
    caseSensitive: true,
  });

  fastify.setErrorHandler(function (error, request, reply) {
    logger.error(
      {
        err: error,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        query: request.query,
        body: request.body,
      },
      'Caught an uncaught request handler exception 🚨',
    );

    reply.code(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Caught an uncaught request handler exception 🚨',
    });
  });

  fastify.register(FastifyStatic, {
    root: config.fastify.public,
  });

  /**
   * Default and fastify metrics
   */
  fastify.register(metricsPlugin, {
    endpoint: '/metrics',
  });

  /**
   * Business and application metrics
   */
  fastify.get('/business-metrics', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const metrics = await register.getMetricsAsJSON();

    logger.trace({ metrics }, 'Metrics was requested by prometheus 🚀');

    return reply.code(200).send(metrics);
  });

  fastify.register(Cookie, {
    secret: config.fastify.cookieSecret,
  });

  fastify.register(fastifyJWT, {
    secret: config.fastify.auth.secret,
    verify: { maxAge: config.isProduction ? config.fastify.auth.tokenTtlMs : ONE_WEEK_MS },
  });

  fastify.register(fastifyRawBody, {
    field: 'rawBody', // change the default request.rawBody property name
    global: false, // add the rawBody to every request. **Default true**
    encoding: false, // set it to false to set rawBody as a Buffer **Default utf8**
    runFirst: true, // get the body before any preParsing hook change/uncompress it. **Default false**
    routes: [], // array of routes, **`global`** will be ignored, wildcard routes not supported
  });

  fastify.register(routerFastifyPlugin, {
    prefix: '/api',
    logger,
    config,
  });

  fastify.register(MercuriusGQLUpload, {
    logger,
  });

  fastify.register(Mercurius, {
    schema: [
      gql`
        ${await readFile(resolve(__dirname, './graphql/macros-setup/lighting-macros-setup.graphql'), {
          encoding: 'utf8',
        })}
      `,
      gql`
        ${await readFile(resolve(__dirname, './graphql/macros/lighting-macros.graphql'), { encoding: 'utf8' })}
      `,
      gql`
        ${await readFile(resolve(__dirname, './graphql/authentication-and-access-control.graphql'), {
          encoding: 'utf8',
        })}
      `,
      gql`
        ${await readFile(resolve(__dirname, './graphql/schema.graphql'), { encoding: 'utf8' })}
      `,
    ],
    resolvers: getResolvers({
      fastify,
      config,
      logger,
      eventBus,
      userRepository,
      refreshSessionRepository,
      wirenboardDeviceRepository,
    }),
    graphiql: !config.isProduction,
    subscription: true,
  });

  fastify.register(MercuriusAuth, {
    authContext: (context): AuthContext => {
      const { app, reply } = context;
      const { authorization = '', fingerprint = '' } = reply.request.headers;
      const { refreshToken } = reply.request.cookies;

      if (!authorization) {
        return { fingerprint: fingerprint as string, refreshToken, userId: UNKNOWN_USER_ID, role: UserRole.UNKNOWN };
      }

      try {
        const { userId, role = UserRole.UNKNOWN, onlyForActivateTwoFa }: JwtPayload = app.jwt.verify(authorization);

        return { fingerprint: fingerprint as string, refreshToken, userId, role, onlyForActivateTwoFa };
      } catch (error) {
        logger.error(
          { authorization, headers: reply.request.headers, cookies: reply.request.cookies, err: error },
          'JWT is invalid 🚨',
        );

        return { fingerprint: fingerprint as string, refreshToken, userId: UNKNOWN_USER_ID, role: UserRole.UNKNOWN };
      }
    },
    async applyPolicy(authDirectiveAST, parent, arguments_, context, info: GraphQLResolveInfo) {
      if (context.auth?.onlyForActivateTwoFa) {
        /**
         * ! Проверить имя мутации, если используется не confirmTwoFa то кидать ошибку, так как этот токен
         * ! предназначен, только для confirmTwoFa и более ни для чего.
         * ! Рабочий токен будет выдан после verifyTwoFa.
         */
        // console.log(authDirectiveAST);
        // console.log(info);
      }

      const requires = authDirectiveAST.arguments.find((argument: any) => argument.name.value === 'requires');

      const authValues: any[] = requires.value.values;

      return authValues.some(({ value }: { value: UserRole }) => value === context.auth?.role);
    },
    authDirective: 'auth',
  });

  await codegenMercurius(fastify, {
    targetPath: './src/graphql-types.ts',
  });

  return fastify;
};

declare module 'mercurius' {
  type MercuriusAuthContext = AuthContext;
}

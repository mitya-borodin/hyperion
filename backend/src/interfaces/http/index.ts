import Fastify, { FastifyInstance } from "fastify";
import helmet from "fastify-helmet";
import metricsPlugin from "fastify-metrics";
import Swagger from "fastify-swagger";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";
import { Connection } from "rethinkdb-ts";

import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import { Config } from "../../infrastructure/config";
import { register } from "../../infrastructure/prometheus";

import routerFastifyPlugin from "./routes";

type CreateHttpInterfaceParams = {
  config: Config;
  rethinkdbConnection: Connection;
  logger: Logger;
  lightingRepository: ILightingRepository;
};

export const createHttpInterface = ({
  config,
  logger,
  lightingRepository,
  rethinkdbConnection,
}: CreateHttpInterfaceParams): FastifyInstance => {
  const fastify = Fastify({
    caseSensitive: true,
    logger: {
      level: config.fastify.log.level,
    },
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
      "Unexpected error",
    );

    reply.code(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Unexpected error",
    });
  });

  fastify.register(helmet);

  fastify.register(metricsPlugin, {
    endpoint: "/metrics",
    enableDefaultMetrics: true,
    register,
  });

  if (!config.production) {
    fastify.register(Swagger, {
      routePrefix: "/swagger",
      exposeRoute: true,
      staticCSP: true,
      swagger: {
        info: {
          title: "Butler API",
          description: "Butler API documentation",
          version: "1.0.0",
        },
        externalDocs: {
          url: "https://github.com/mitya-borodin/butler/tree/master/backend/src/interfaces/http",
          description: "You can dive into source code for getting more details",
        },
        tags: [{ name: "lighting", description: "Lighting" }],
      },
    });
  }

  fastify.register(routerFastifyPlugin, {
    prefix: "/api",
    logger,
    lightingRepository,
    config,
    rethinkdbConnection,
  });

  return fastify;
};

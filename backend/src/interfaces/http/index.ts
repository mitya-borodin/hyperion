import Fastify, { FastifyInstance } from "fastify";
import helmet from "fastify-helmet";
import metricsPlugin from "fastify-metrics";
import Swagger from "fastify-swagger";
import { Logger } from "pino";
import { Connection } from "rethinkdb-ts";

import { Config } from "../../infrastructure/config";
import { register } from "../../infrastructure/prometheus";

import routerFastifyPlugin from "./routes";

type CreateHttpInterfaceParams = {
  config: Config;
  rethinkdbConnection: Connection;
  logger: Logger;
};

export const createHttpInterface = ({ config }: CreateHttpInterfaceParams): FastifyInstance => {
  const fastify = Fastify({
    logger: {
      level: config.log.level,
    },
  });

  fastify.register(helmet);

  fastify.register(metricsPlugin, {
    endpoint: "/metrics",
    enableDefaultMetrics: true,
    register,
  });

  if (!config.production) {
    fastify.register(Swagger, {
      exposeRoute: true,
      hideUntagged: true,
      routePrefix: "/docs",
      swagger: {
        info: {
          title: "Butler API",
          description: "Butler API documentation",
          version: "1.0.0",
        },
        tags: [{ name: "health", description: "Status check endpoints" }],
      },
      uiConfig: {
        deepLinking: true,
        docExpansion: "none",
      },
    });
  }

  fastify.register(routerFastifyPlugin, { prefix: "/api" });

  return fastify;
};

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Logger } from "pino";
import { Connection } from "rethinkdb-ts";

import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import { Config } from "../../../infrastructure/config";

import { lightingFastifyPlugin } from "./lighting";

export type routerFastifyPluginOptions = {
  logger: Logger;
  lightingRepository: ILightingRepository;
  config: Config;
  rethinkdbConnection: Connection;
};

const router: FastifyPluginAsync<routerFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  fastify.register(lightingFastifyPlugin, {
    prefix: "lighting",
    logger: options.logger,
    lightingRepository: options.lightingRepository,
    config: options.config,
    rethinkdbConnection: options.rethinkdbConnection,
  });
};

export const routerFastifyPlugin = fp(router, {
  fastify: "3.x",
  name: "fastify-router",
});

export default routerFastifyPlugin;

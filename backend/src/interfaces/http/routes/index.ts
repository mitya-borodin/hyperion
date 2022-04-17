import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Logger } from "pino";

import { ILightingRepository } from "../../../domain/lighting/lighting-repository";

import { lightingFastifyPlugin } from "./lighting";

export type routerFastifyPluginOptions = {
  logger: Logger;
  lightingRepository: ILightingRepository;
};

const router: FastifyPluginAsync<routerFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  fastify.register(lightingFastifyPlugin, {
    prefix: "lighting",
    logger: options.logger,
    lightingRepository: options.lightingRepository,
  });
};

export const routerFastifyPlugin = fp(router, {
  fastify: "3.x",
  name: "fastify-router",
});

export default routerFastifyPlugin;

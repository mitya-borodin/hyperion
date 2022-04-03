import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import illuminationFastifyPlugin from "./illumination";

export type routerFastifyPluginOptions = Record<never, never>;

const router: FastifyPluginAsync<routerFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  fastify.register(illuminationFastifyPlugin, { prefix: "illumination", ...options });
};

export const routerFastifyPlugin = fp(router, {
  fastify: "3.x",
  name: "fastify-router",
});

export default routerFastifyPlugin;

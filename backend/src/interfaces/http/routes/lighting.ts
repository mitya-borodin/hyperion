import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import stateLightningQuerystringSchema from "../schemas/lighting/get-state.querystring.json";
import { StateLightningQuerystringSchema } from "../types/lighting/get-state.querystring";

export type lightingFastifyPluginOptions = Record<never, never>;

const lighting: FastifyPluginAsync<lightingFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  fastify.route<{ Querystring: StateLightningQuerystringSchema }>({
    method: "GET",
    url: "/state",
    schema: {
      querystring: stateLightningQuerystringSchema,
    },
    handler: async (request, reply) => {
      const { name } = request.query;

      reply.send({ hello: "options.name" });
    },
  });
  fastify.route<{ Querystring: StateLightningQuerystringSchema }>({
    method: "POST",
    url: "/on",
    schema: {
      querystring: stateLightningQuerystringSchema,
    },
    handler: async (request, reply) => {
      const { name } = request.query;

      reply.send({ hello: "options.name" });
    },
  });
  fastify.route<{ Querystring: StateLightningQuerystringSchema }>({
    method: "POST",
    url: "/off",
    schema: {
      querystring: stateLightningQuerystringSchema,
    },
    handler: async (request, reply) => {
      const { name } = request.query;

      reply.send({ hello: "options.name" });
    },
  });
};

export const lightingFastifyPlugin = fp(lighting, {
  fastify: "3.x",
  name: "fastify-lighting-router",
});

export default lightingFastifyPlugin;

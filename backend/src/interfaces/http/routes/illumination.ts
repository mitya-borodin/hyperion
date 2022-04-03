import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import stateLightningQuerystringSchema from "../schemas/illumination/get-state.querystring.json";
import { StateLightningQuerystringSchema } from "../types/illumination/get-state.querystring";

export type illuminationFastifyPluginOptions = Record<never, never>;

const illumination: FastifyPluginAsync<illuminationFastifyPluginOptions> = async (
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

export const illuminationFastifyPlugin = fp(illumination, {
  fastify: "3.x",
  name: "fastify-illumination-router",
});

export default illuminationFastifyPlugin;

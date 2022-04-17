import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { isLeft } from "fp-ts/lib/Either";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";

import { getGetLightningDeviceCommand } from "../../../application/lighting/get-lightning-device";
import { getGetLightningGroupCommand } from "../../../application/lighting/get-lightning-group";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import getLightningDeviceQuerystringSchema from "../schemas/lighting/get-lightning-device.querystring.json";
import getLightningDeviceReplySchema from "../schemas/lighting/get-lightning-device.reply.json";
import getLightningGroupQuerystringSchema from "../schemas/lighting/get-lightning-group.querystring.json";
import getLightningGroupReplySchema from "../schemas/lighting/get-lightning-group.reply.json";
import { GetLightningDeviceQuerystringSchema } from "../types/lighting/get-lightning-device.querystring";
import { GetLightningDeviceReplySchema } from "../types/lighting/get-lightning-device.reply";
import { GetLightningGroupQuerystringSchema } from "../types/lighting/get-lightning-group.querystring";
import { GetLightningGroupReplySchema } from "../types/lighting/get-lightning-group.reply";

export type lightingFastifyPluginOptions = {
  logger: Logger;
  lightingRepository: ILightingRepository;
};

const lighting: FastifyPluginAsync<lightingFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  const logger = options.logger.child({ name: "fastify-lighting-router" });

  const { lightingRepository } = options;

  fastify.route<{
    Querystring: GetLightningDeviceQuerystringSchema;
    Reply: GetLightningDeviceReplySchema;
  }>({
    method: "GET",
    url: "/get-lightning-device",
    schema: {
      querystring: getLightningDeviceQuerystringSchema,
      response: {
        [HttpStatusCodes.OK]: getLightningDeviceReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { deviceId } = request.query;

      const getLightningDeviceCommand = getGetLightningDeviceCommand(lightingRepository);

      const lightningDevice = await getLightningDeviceCommand({ deviceId });

      if (isLeft(lightningDevice)) {
        logger.error({ deviceId, error: lightningDevice.left }, "Lightning device wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply.code(HttpStatusCodes.OK).send(lightningDevice.right);
    },
  });

  fastify.route<{
    Querystring: GetLightningGroupQuerystringSchema;
    Reply: GetLightningGroupReplySchema;
  }>({
    method: "GET",
    url: "/get-lightning-group",
    schema: {
      querystring: getLightningGroupQuerystringSchema,
      response: {
        [HttpStatusCodes.OK]: getLightningGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.query;

      const getLightningGroupCommand = getGetLightningGroupCommand(lightingRepository);

      const lightningGroup = await getLightningGroupCommand({ groupId });

      if (isLeft(lightningGroup)) {
        logger.error({ groupId, error: lightningGroup.left }, "Lightning group wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply.code(HttpStatusCodes.OK).send(lightningGroup.right);
    },
  });
};

export const lightingFastifyPlugin = fp(lighting, {
  fastify: "3.x",
  name: "fastify-lighting-router",
});

export default lightingFastifyPlugin;

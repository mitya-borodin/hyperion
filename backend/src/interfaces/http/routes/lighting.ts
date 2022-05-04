import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { isLeft } from "fp-ts/Either";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";

import { getGetLightningDeviceCommand } from "../../../application/lighting/get-lightning-device";
import { getGetLightningGroupCommand } from "../../../application/lighting/get-lightning-group";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import addLightningGroupBodySchema from "../schemas/lighting/add-lightning-group.body.json";
import addLightningGroupReplySchema from "../schemas/lighting/add-lightning-group.reply.json";
import createLightningGroupBodySchema from "../schemas/lighting/create-lightning-device.body.json";
import createLightningGroupReplaySchema from "../schemas/lighting/create-lightning-device.reply.json";
import decommissioningLightningGroupBodySchema from "../schemas/lighting/decommissioning-lightning-device.body.json";
import decommissioningLightningGroupReplaySchema from "../schemas/lighting/decommissioning-lightning-device.reply.json";
import getLightningDeviceQuerystringSchema from "../schemas/lighting/get-lightning-device.querystring.json";
import getLightningDeviceReplySchema from "../schemas/lighting/get-lightning-device.reply.json";
import getLightningGroupQuerystringSchema from "../schemas/lighting/get-lightning-group.querystring.json";
import getLightningGroupReplySchema from "../schemas/lighting/get-lightning-group.reply.json";
import initializeLightningGroupBodySchema from "../schemas/lighting/initialize-lightning-group.body.json";
import initializeLightningGroupReplySchema from "../schemas/lighting/initialize-lightning-group.reply.json";
import moveLightningGroupBodySchema from "../schemas/lighting/move-lightning-group.body.json";
import moveLightningGroupReplySchema from "../schemas/lighting/move-lightning-group.reply.json";
import removeLightningGroupBodySchema from "../schemas/lighting/remove-lightning-group.body.json";
import removeLightningGroupReplySchema from "../schemas/lighting/remove-lightning-group.reply.json";
import turnOffGroupBodySchema from "../schemas/lighting/turn-off-group.body.json";
import turnOffGroupReplySchema from "../schemas/lighting/turn-off-group.reply.json";
import turnOnGroupBodySchema from "../schemas/lighting/turn-on-group.body.json";
import turnOnGroupReplySchema from "../schemas/lighting/turn-on-group.reply.json";
import updateLightningGroupBodySchema from "../schemas/lighting/update-lightning-device.body.json";
import updateLightningGroupReplaySchema from "../schemas/lighting/update-lightning-device.reply.json";
import { AddLightningGroupBodySchema } from "../types/lighting/add-lightning-group.body";
import { AddLightningGroupReplySchema } from "../types/lighting/add-lightning-group.reply";
import { CreateLightningDeviceBodySchema } from "../types/lighting/create-lightning-device.body";
import { CreateLightningDeviceReplySchema } from "../types/lighting/create-lightning-device.reply";
import { DecommissioningLightningDeviceBodySchema } from "../types/lighting/decommissioning-lightning-device.body";
import { DecommissioningLightningDeviceReplySchema } from "../types/lighting/decommissioning-lightning-device.reply";
import { GetLightningDeviceQuerystringSchema } from "../types/lighting/get-lightning-device.querystring";
import { GetLightningDeviceReplySchema } from "../types/lighting/get-lightning-device.reply";
import { GetLightningGroupQuerystringSchema } from "../types/lighting/get-lightning-group.querystring";
import { GetLightningGroupReplySchema } from "../types/lighting/get-lightning-group.reply";
import { InitializeLightningGroupBodySchema } from "../types/lighting/initialize-lightning-group.body";
import { InitializeLightningGroupReplySchema } from "../types/lighting/initialize-lightning-group.reply";
import { MoveLightningGroupBodySchema } from "../types/lighting/move-lightning-group.body";
import { MoveLightningGroupReplySchema } from "../types/lighting/move-lightning-group.reply";
import { RemoveLightningGroupBodySchema } from "../types/lighting/remove-lightning-group.body";
import { RemoveLightningGroupReplySchema } from "../types/lighting/remove-lightning-group.reply";
import { TurnOffGroupBodySchema } from "../types/lighting/turn-off-group.body";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";
import { TurnOnGroupBodySchema } from "../types/lighting/turn-on-group.body";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";
import { UpdateLightningDeviceBodySchema } from "../types/lighting/update-lightning-device.body";
import { UpdateLightningDeviceReplySchema } from "../types/lighting/update-lightning-device.reply";

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
    Body: CreateLightningDeviceBodySchema;
    Reply: CreateLightningDeviceReplySchema;
  }>({
    method: "PUT",
    url: "/create-lightning-device",
    schema: {
      body: createLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: createLightningGroupReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { deviceId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ deviceId });
    },
  });

  fastify.route<{
    Body: UpdateLightningDeviceBodySchema;
    Reply: UpdateLightningDeviceReplySchema;
  }>({
    method: "POST",
    url: "/update-lightning-device",
    schema: {
      body: updateLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: updateLightningGroupReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { deviceId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ deviceId });
    },
  });

  fastify.route<{
    Body: DecommissioningLightningDeviceBodySchema;
    Reply: DecommissioningLightningDeviceReplySchema;
  }>({
    method: "POST",
    url: "/decommissioning-lightning-device",
    schema: {
      body: decommissioningLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: decommissioningLightningGroupReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { deviceId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ deviceId });
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

  fastify.route<{
    Body: InitializeLightningGroupBodySchema;
    Reply: InitializeLightningGroupReplySchema;
  }>({
    method: "POST",
    url: "/initialize-lightning-group",
    schema: {
      body: initializeLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: initializeLightningGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });

  fastify.route<{
    Body: AddLightningGroupBodySchema;
    Reply: AddLightningGroupReplySchema;
  }>({
    method: "POST",
    url: "/add-lightning-device-into-group",
    schema: {
      body: addLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: addLightningGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });

  fastify.route<{
    Body: RemoveLightningGroupBodySchema;
    Reply: RemoveLightningGroupReplySchema;
  }>({
    method: "POST",
    url: "/remove-lightning-device-from-group",
    schema: {
      body: removeLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: removeLightningGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });

  fastify.route<{
    Body: MoveLightningGroupBodySchema;
    Reply: MoveLightningGroupReplySchema;
  }>({
    method: "POST",
    url: "/move-lightning-device-to-group",
    schema: {
      body: moveLightningGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: moveLightningGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });

  fastify.route<{
    Body: TurnOnGroupBodySchema;
    Reply: TurnOnGroupReplySchema;
  }>({
    method: "POST",
    url: "/turn-on-group",
    schema: {
      body: turnOnGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: turnOnGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });

  fastify.route<{
    Body: TurnOffGroupBodySchema;
    Reply: TurnOffGroupReplySchema;
  }>({
    method: "POST",
    url: "/turn-off-group",
    schema: {
      body: turnOffGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: turnOffGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.body;

      reply.code(HttpStatusCodes.OK).send({ groupId });
    },
  });
};

export const lightingFastifyPlugin = fp(lighting, {
  fastify: "3.x",
  name: "fastify-lighting-router",
});

export default lightingFastifyPlugin;

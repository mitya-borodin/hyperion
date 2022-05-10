import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { isLeft } from "fp-ts/Either";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";

import { getAddLightingDeviceIntoGroupCommand } from "../../../application/lighting/add-lighting-device-into-group";
import { getCreateLightingDevicesCommand } from "../../../application/lighting/create-lighting-devices";
import { getDecommissioningLightingDevicesCommand } from "../../../application/lighting/decommissioning-lighting-devices";
import { getGetLightningDeviceCommand } from "../../../application/lighting/get-lightning-device";
import { getGetLightningGroupCommand } from "../../../application/lighting/get-lightning-group";
import { getInitializeLightingGroupCommand } from "../../../application/lighting/initialize-lighting-group";
import { getMoveLightingDeviceToAnotherGroupCommand } from "../../../application/lighting/move-lighting-device-to-another-group";
import { getRemoveLightingDeviceFromGroupCommand } from "../../../application/lighting/remove-lighting-device-from-group";
import { getUpdateLightingDevicesCommand } from "../../../application/lighting/update-lighting-devices";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import { mapAddLightningDeviceIntoGroupToHttp } from "../mappers/add-lightning-device-into-group-mapper";
import {
  mapCreateLightningDevicesToApp,
  mapCreateLightningDevicesToHttp,
} from "../mappers/create-lighting-devices-mapper";
import { mapDecommissioningLightningDeviceToHttp } from "../mappers/decommissioning-lightning-device-mapper";
import { mapGetLightningDeviceToHttp } from "../mappers/get-lightning-device-mapper";
import { mapGetLightningGroupToHttp } from "../mappers/get-lightning-group-mapper";
import { mapInitializeLightningGroupsToHttp } from "../mappers/initialize-lightning-groups-mapper";
import { mapMoveLightningDeviceToGroupToHttp } from "../mappers/move-lightning-device-to-group-mapper";
import { mapRemoveLightningDeviceFromGroupToHttp } from "../mappers/remove-lightning-device-from-group-mapper";
import {
  mapUpdateLightningDevicesToApp,
  mapUpdateLightningDevicesToHttp,
} from "../mappers/update-lightning-device-mapper";
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
import { AddLightningDeviceInLightningGroupBodySchema } from "../types/lighting/add-lightning-group.body";
import { AddLightningDeviceInLightningGroupReplySchema } from "../types/lighting/add-lightning-group.reply";
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
import { RemoveLightningDeviceFromLightningGroupBodySchema } from "../types/lighting/remove-lightning-group.body";
import { RemoveLightningDeviceFromLightningGroupReplySchema } from "../types/lighting/remove-lightning-group.reply";
import { TurnOffGroupBodySchema } from "../types/lighting/turn-off-group.body";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";
import { TurnOnGroupBodySchema } from "../types/lighting/turn-on-group.body";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";
import { UpdateLightningDevicesBodySchema } from "../types/lighting/update-lightning-device.body";
import { UpdateLightningDevicesReplySchema } from "../types/lighting/update-lightning-device.reply";

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

      if (lightningDevice.right === null) {
        logger.error({ deviceId }, "Lightning device wasn't found");

        return reply.code(HttpStatusCodes.NOT_FOUND);
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightningDeviceToHttp(lightningDevice.right));
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
      const devices = request.body;

      const createLightingDevicesCommand = getCreateLightingDevicesCommand(lightingRepository);

      const lightingDevices = await createLightingDevicesCommand({
        devices: mapCreateLightningDevicesToApp(devices),
      });

      if (isLeft(lightingDevices)) {
        logger.error({ devices, error: lightingDevices.left }, "Lightning devices wasn't created");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply.code(HttpStatusCodes.OK).send(mapCreateLightningDevicesToHttp(lightingDevices.right));
    },
  });

  fastify.route<{
    Body: UpdateLightningDevicesBodySchema;
    Reply: UpdateLightningDevicesReplySchema;
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
      const devices = request.body;

      const updateLightingDevicesCommand = getUpdateLightingDevicesCommand(lightingRepository);

      const lightingDevices = await updateLightingDevicesCommand({
        devices: mapUpdateLightningDevicesToApp(devices),
      });

      if (isLeft(lightingDevices)) {
        logger.error({ devices, error: lightingDevices.left }, "Lightning devices wasn't updated");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply.code(HttpStatusCodes.OK).send(mapUpdateLightningDevicesToHttp(lightingDevices.right));
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
      const { deviceIds } = request.body;

      const decommissioningLightingDevicesCommand =
        getDecommissioningLightingDevicesCommand(lightingRepository);

      const lightingDevices = await decommissioningLightingDevicesCommand({
        deviceIds,
      });

      if (isLeft(lightingDevices)) {
        logger.error(
          { deviceIds, error: lightingDevices.left },
          "Lightning devices wasn't decommissioned",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapDecommissioningLightningDeviceToHttp(lightingDevices.right));
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

      if (lightningGroup.right === null) {
        logger.error({ groupId }, "Lightning group wasn't found");

        return reply.code(HttpStatusCodes.NOT_FOUND);
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightningGroupToHttp(lightningGroup.right));
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
      const { lightingGroupLocations } = request.body;

      const initializeLightingGroupCommand = getInitializeLightingGroupCommand(lightingRepository);

      const lightningGroups = await initializeLightingGroupCommand({ lightingGroupLocations });

      if (isLeft(lightningGroups)) {
        logger.error(
          { lightingGroupLocations, error: lightningGroups.left },
          "Lightning group wasn't initialized",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapInitializeLightningGroupsToHttp(lightningGroups.right));
    },
  });

  fastify.route<{
    Body: AddLightningDeviceInLightningGroupBodySchema;
    Reply: AddLightningDeviceInLightningGroupReplySchema;
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
      const { lightingGroupLocation, deviceIds } = request.body;

      const addLightingDeviceIntoGroupCommand =
        getAddLightingDeviceIntoGroupCommand(lightingRepository);

      const lightningGroup = await addLightingDeviceIntoGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (isLeft(lightningGroup)) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightningGroup.left },
          "Lightning device wasn't added to lightning group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapAddLightningDeviceIntoGroupToHttp(lightningGroup.right));
    },
  });

  fastify.route<{
    Body: RemoveLightningDeviceFromLightningGroupBodySchema;
    Reply: RemoveLightningDeviceFromLightningGroupReplySchema;
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
      const { lightingGroupLocation, deviceIds } = request.body;

      const removeLightingDeviceFromGroupCommand =
        getRemoveLightingDeviceFromGroupCommand(lightingRepository);

      const lightningGroup = await removeLightingDeviceFromGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (isLeft(lightningGroup)) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightningGroup.left },
          "Lightning device wasn't removed from lightning group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapRemoveLightningDeviceFromGroupToHttp(lightningGroup.right));
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
      const { lightingGroupLocationFrom, lightingGroupLocationTo, deviceIds } = request.body;

      const moveLightingDeviceToAnotherGroupCommand =
        getMoveLightingDeviceToAnotherGroupCommand(lightingRepository);

      const result = await moveLightingDeviceToAnotherGroupCommand({
        lightingGroupLocationFrom,
        lightingGroupLocationTo,
        deviceIds,
      });

      if (isLeft(result)) {
        logger.error(
          {
            lightingGroupLocationFrom,
            lightingGroupLocationTo,
            deviceIds,
            errors: result.left,
          },
          "Lightning device wasn't moved from lightning group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }

      reply.code(HttpStatusCodes.OK).send(mapMoveLightningDeviceToGroupToHttp(result.right));
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

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { isLeft } from "fp-ts/Either";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";

import { getAddLightingDeviceIntoGroupCommand } from "../../../application/lighting/add-lighting-device-into-group";
import { getCreateLightingDevicesCommand } from "../../../application/lighting/create-lighting-devices";
import { getDecommissioningLightingDevicesCommand } from "../../../application/lighting/decommissioning-lighting-devices";
import { getGetLightingDeviceCommand } from "../../../application/lighting/get-lighting-device";
import { getGetLightingGroupCommand } from "../../../application/lighting/get-lighting-group";
import { getInitializeLightingGroupCommand } from "../../../application/lighting/initialize-lighting-group";
import { getMoveLightingDeviceToAnotherGroupCommand } from "../../../application/lighting/move-lighting-device-to-another-group";
import { getRemoveLightingDeviceFromGroupCommand } from "../../../application/lighting/remove-lighting-device-from-group";
import { getTurnOffGroupCommand } from "../../../application/lighting/turn-off-group";
import { getTurnOnGroupCommand } from "../../../application/lighting/turn-on-group";
import { getUpdateLightingDevicesCommand } from "../../../application/lighting/update-lighting-devices";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import { mapAddLightingDeviceInGroupToHttp } from "../mappers/add-lighting-device-in-group-mapper";
import {
  mapCreateLightingDevicesToApp,
  mapCreateLightingDevicesToHttp,
} from "../mappers/create-lighting-devices-mapper";
import { mapDecommissioningLightingDeviceToHttp } from "../mappers/decommissioning-lighting-device-mapper";
import { mapGetLightingDeviceToHttp } from "../mappers/get-lighting-device-mapper";
import { mapGetLightingGroupToHttp } from "../mappers/get-lighting-group-mapper";
import { mapInitializeLightingGroupsToHttp } from "../mappers/initialize-lighting-groups-mapper";
import { mapMoveLightingDeviceToGroupToHttp } from "../mappers/move-lighting-device-to-group-mapper";
import { mapRemoveLightingDeviceFromGroupToHttp } from "../mappers/remove-lighting-device-from-group-mapper";
import { mapTurnOffGroupToHttp } from "../mappers/turn-off-group-mapper";
import { mapTurnOnGroupToHttp } from "../mappers/turn-on-group-mapper";
import {
  mapUpdateLightingDevicesToApp,
  mapUpdateLightingDevicesToHttp,
} from "../mappers/update-lighting-device-mapper";
import addLightingDeviceInGroupBodySchema from "../schemas/lighting/add-lighting-device-in-group.body.json";
import addLightingDeviceInGroupReplySchema from "../schemas/lighting/add-lighting-device-in-group.reply.json";
import createLightingGroupBodySchema from "../schemas/lighting/create-lighting-device.body.json";
import createLightingGroupReplaySchema from "../schemas/lighting/create-lighting-device.reply.json";
import decommissioningLightingGroupBodySchema from "../schemas/lighting/decommissioning-lighting-device.body.json";
import decommissioningLightingGroupReplaySchema from "../schemas/lighting/decommissioning-lighting-device.reply.json";
import getLightingDeviceQuerystringSchema from "../schemas/lighting/get-lighting-device.querystring.json";
import getLightingDeviceReplySchema from "../schemas/lighting/get-lighting-device.reply.json";
import getLightingGroupQuerystringSchema from "../schemas/lighting/get-lighting-group.querystring.json";
import getLightingGroupReplySchema from "../schemas/lighting/get-lighting-group.reply.json";
import initializeLightingGroupBodySchema from "../schemas/lighting/initialize-lighting-group.body.json";
import initializeLightingGroupReplySchema from "../schemas/lighting/initialize-lighting-group.reply.json";
import moveLightingGroupBodySchema from "../schemas/lighting/move-lighting-group.body.json";
import moveLightingGroupReplySchema from "../schemas/lighting/move-lighting-group.reply.json";
import removeLightingDeviceFromGroupBodySchema from "../schemas/lighting/remove-lighting-device-from-group.body.json";
import removeLightingDeviceFromGroupReplySchema from "../schemas/lighting/remove-lighting-device-from-group.reply.json";
import turnOffGroupBodySchema from "../schemas/lighting/turn-off-group.body.json";
import turnOffGroupReplySchema from "../schemas/lighting/turn-off-group.reply.json";
import turnOnGroupBodySchema from "../schemas/lighting/turn-on-group.body.json";
import turnOnGroupReplySchema from "../schemas/lighting/turn-on-group.reply.json";
import updateLightingGroupBodySchema from "../schemas/lighting/update-lighting-device.body.json";
import updateLightingGroupReplaySchema from "../schemas/lighting/update-lighting-device.reply.json";
import { AddLightingDeviceInGroupBodySchema } from "../types/lighting/add-lighting-device-in-group.body";
import { AddLightingDeviceInGroupReplySchema } from "../types/lighting/add-lighting-device-in-group.reply";
import { CreateLightingDeviceBodySchema } from "../types/lighting/create-lighting-device.body";
import { CreateLightingDeviceReplySchema } from "../types/lighting/create-lighting-device.reply";
import { DecommissioningLightingDeviceBodySchema } from "../types/lighting/decommissioning-lighting-device.body";
import { DecommissioningLightingDeviceReplySchema } from "../types/lighting/decommissioning-lighting-device.reply";
import { GetLightingDeviceQuerystringSchema } from "../types/lighting/get-lighting-device.querystring";
import { GetLightingDeviceReplySchema } from "../types/lighting/get-lighting-device.reply";
import { GetLightingGroupQuerystringSchema } from "../types/lighting/get-lighting-group.querystring";
import { GetLightingGroupReplySchema } from "../types/lighting/get-lighting-group.reply";
import { InitializeLightingGroupBodySchema } from "../types/lighting/initialize-lighting-group.body";
import { InitializeLightingGroupReplySchema } from "../types/lighting/initialize-lighting-group.reply";
import { MoveLightingGroupBodySchema } from "../types/lighting/move-lighting-group.body";
import { MoveLightingGroupReplySchema } from "../types/lighting/move-lighting-group.reply";
import { RemoveLightingDeviceFromGroupBodySchema } from "../types/lighting/remove-lighting-device-from-group.body";
import { RemoveLightingDeviceFromGroupReplySchema } from "../types/lighting/remove-lighting-device-from-group.reply";
import { TurnOffGroupBodySchema } from "../types/lighting/turn-off-group.body";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";
import { TurnOnGroupBodySchema } from "../types/lighting/turn-on-group.body";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";
import { UpdateLightingDevicesBodySchema } from "../types/lighting/update-lighting-device.body";
import { UpdateLightingDevicesReplySchema } from "../types/lighting/update-lighting-device.reply";

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
    Querystring: GetLightingDeviceQuerystringSchema;
    Reply: GetLightingDeviceReplySchema;
  }>({
    method: "GET",
    url: "/get-lighting-device",
    schema: {
      querystring: getLightingDeviceQuerystringSchema,
      response: {
        [HttpStatusCodes.OK]: getLightingDeviceReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { deviceId } = request.query;

      const getLightingDeviceCommand = getGetLightingDeviceCommand(lightingRepository);

      const lightingDevice = await getLightingDeviceCommand({ deviceId });

      if (isLeft(lightingDevice)) {
        logger.error({ deviceId, error: lightingDevice.left }, "Lighting device wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      if (lightingDevice.right === null) {
        logger.error({ deviceId }, "Lighting device wasn't found");

        return reply.code(HttpStatusCodes.NOT_FOUND).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightingDeviceToHttp(lightingDevice.right));
    },
  });

  fastify.route<{
    Body: CreateLightingDeviceBodySchema;
    Reply: CreateLightingDeviceReplySchema;
  }>({
    method: "PUT",
    url: "/create-lighting-device",
    schema: {
      body: createLightingGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: createLightingGroupReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const devices = request.body;

      const createLightingDevicesCommand = getCreateLightingDevicesCommand(lightingRepository);

      const lightingDevices = await createLightingDevicesCommand({
        devices: mapCreateLightingDevicesToApp(devices),
      });

      if (isLeft(lightingDevices)) {
        logger.error({ devices, error: lightingDevices.left }, "Lighting devices wasn't created");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapCreateLightingDevicesToHttp(lightingDevices.right));
    },
  });

  fastify.route<{
    Body: UpdateLightingDevicesBodySchema;
    Reply: UpdateLightingDevicesReplySchema;
  }>({
    method: "POST",
    url: "/update-lighting-device",
    schema: {
      body: updateLightingGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: updateLightingGroupReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const devices = request.body;

      const updateLightingDevicesCommand = getUpdateLightingDevicesCommand(lightingRepository);

      const lightingDevices = await updateLightingDevicesCommand({
        devices: mapUpdateLightingDevicesToApp(devices),
      });

      if (isLeft(lightingDevices)) {
        logger.error({ devices, error: lightingDevices.left }, "Lighting devices wasn't updated");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapUpdateLightingDevicesToHttp(lightingDevices.right));
    },
  });

  fastify.route<{
    Body: DecommissioningLightingDeviceBodySchema;
    Reply: DecommissioningLightingDeviceReplySchema;
  }>({
    method: "POST",
    url: "/decommissioning-lighting-device",
    schema: {
      body: decommissioningLightingGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: decommissioningLightingGroupReplaySchema,
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
          "Lighting devices wasn't decommissioned",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapDecommissioningLightingDeviceToHttp(lightingDevices.right));
    },
  });

  fastify.route<{
    Querystring: GetLightingGroupQuerystringSchema;
    Reply: GetLightingGroupReplySchema;
  }>({
    method: "GET",
    url: "/get-lighting-group",
    schema: {
      querystring: getLightingGroupQuerystringSchema,
      response: {
        [HttpStatusCodes.OK]: getLightingGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { groupId } = request.query;

      const getLightingGroupCommand = getGetLightingGroupCommand(lightingRepository);

      const lightingGroup = await getLightingGroupCommand({ groupId });

      if (isLeft(lightingGroup)) {
        logger.error({ groupId, error: lightingGroup.left }, "Lighting group wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      if (lightingGroup.right === null) {
        logger.error({ groupId }, "Lighting group wasn't found");

        return reply.code(HttpStatusCodes.NOT_FOUND).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightingGroupToHttp(lightingGroup.right));
    },
  });

  fastify.route<{
    Body: InitializeLightingGroupBodySchema;
    Reply: InitializeLightingGroupReplySchema;
  }>({
    method: "POST",
    url: "/initialize-lighting-group",
    schema: {
      body: initializeLightingGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: initializeLightingGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocations } = request.body;

      const initializeLightingGroupCommand = getInitializeLightingGroupCommand(lightingRepository);

      const lightingGroups = await initializeLightingGroupCommand({ lightingGroupLocations });

      if (isLeft(lightingGroups)) {
        logger.error(
          { lightingGroupLocations, error: lightingGroups.left },
          "Lighting group wasn't initialized",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapInitializeLightingGroupsToHttp(lightingGroups.right));
    },
  });

  fastify.route<{
    Body: AddLightingDeviceInGroupBodySchema;
    Reply: AddLightingDeviceInGroupReplySchema;
  }>({
    method: "POST",
    url: "/add-lighting-device-into-group",
    schema: {
      body: addLightingDeviceInGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: addLightingDeviceInGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocation, deviceIds } = request.body;

      const addLightingDeviceIntoGroupCommand =
        getAddLightingDeviceIntoGroupCommand(lightingRepository);

      const lightingGroup = await addLightingDeviceIntoGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (isLeft(lightingGroup)) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightingGroup.left },
          "Lighting device wasn't added to lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapAddLightingDeviceInGroupToHttp(lightingGroup.right));
    },
  });

  fastify.route<{
    Body: RemoveLightingDeviceFromGroupBodySchema;
    Reply: RemoveLightingDeviceFromGroupReplySchema;
  }>({
    method: "POST",
    url: "/remove-lighting-device-from-group",
    schema: {
      body: removeLightingDeviceFromGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: removeLightingDeviceFromGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocation, deviceIds } = request.body;

      const removeLightingDeviceFromGroupCommand =
        getRemoveLightingDeviceFromGroupCommand(lightingRepository);

      const lightingGroup = await removeLightingDeviceFromGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (isLeft(lightingGroup)) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightingGroup.left },
          "Lighting device wasn't removed from lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapRemoveLightingDeviceFromGroupToHttp(lightingGroup.right));
    },
  });

  fastify.route<{
    Body: MoveLightingGroupBodySchema;
    Reply: MoveLightingGroupReplySchema;
  }>({
    method: "POST",
    url: "/move-lighting-device-to-group",
    schema: {
      body: moveLightingGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: moveLightingGroupReplySchema,
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
          "Lighting device wasn't moved from lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapMoveLightingDeviceToGroupToHttp(result.right));
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
      const { lightingGroupLocation } = request.body;

      const turnOnGroupCommand = getTurnOnGroupCommand(lightingRepository);

      const lightingGroup = await turnOnGroupCommand({ lightingGroupLocation });

      if (isLeft(lightingGroup)) {
        logger.error(
          {
            lightingGroupLocation,
            errors: lightingGroup.left,
          },
          "Lighting group wasn't turned on",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapTurnOnGroupToHttp(lightingGroup.right));
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
      const { lightingGroupLocation } = request.body;

      const turnOffGroupCommand = getTurnOffGroupCommand(lightingRepository);

      const lightingGroup = await turnOffGroupCommand({ lightingGroupLocation });

      if (isLeft(lightingGroup)) {
        logger.error(
          {
            lightingGroupLocation,
            errors: lightingGroup.left,
          },
          "Lighting group wasn't turned off",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapTurnOffGroupToHttp(lightingGroup.right));
    },
  });
};

export const lightingFastifyPlugin = fp(lighting, {
  fastify: "3.x",
  name: "fastify-lighting-router",
});

export default lightingFastifyPlugin;

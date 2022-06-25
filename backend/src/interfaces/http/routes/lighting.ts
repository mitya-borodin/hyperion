import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import HttpStatusCodes from "http-status-codes";
import { Logger } from "pino";
import { Connection } from "rethinkdb-ts";

import { getAddLightingDevicesIntoGroupCommand } from "../../../application/lighting/add-lighting-devices-into-group";
import { getCreateLightingDevicesCommand } from "../../../application/lighting/create-lighting-devices";
import { getCreateLightingGroupCommand } from "../../../application/lighting/create-lighting-group";
import { getDecommissioningLightingDevicesCommand } from "../../../application/lighting/decommissioning-lighting-devices";
import { getGetLightingDeviceCommand } from "../../../application/lighting/get-lighting-device";
import { getGetLightingDevicesCommand } from "../../../application/lighting/get-lighting-devices";
import { getGetLightingGroupCommand } from "../../../application/lighting/get-lighting-group";
import { getGetLightingGroupsCommand } from "../../../application/lighting/get-lighting-groups";
import { getMoveLightingDevicesToAnotherGroupCommand } from "../../../application/lighting/move-lighting-devices-to-another-group";
import { getRemoveLightingDeviceFromGroupCommand } from "../../../application/lighting/remove-lighting-device-from-group";
import { getTurnOffGroupCommand } from "../../../application/lighting/turn-off-group";
import { getTurnOnGroupCommand } from "../../../application/lighting/turn-on-group";
import { getUpdateProductDataLightingDevicesCommand } from "../../../application/lighting/update-product-data-lighting-devices";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import { Config } from "../../../infrastructure/config";
import { lightingDeviceTable } from "../../../infrastructure/rethinkdb/tables/lighting-device";
import { lightingGroupTable } from "../../../infrastructure/rethinkdb/tables/lighting-group";
import { mapAddLightingDevicesInGroupToHttp } from "../mappers/add-lighting-devices-in-group-mapper";
import {
  mapCreateLightingDevicesToApp,
  mapCreateLightingDevicesToHttp,
} from "../mappers/create-lighting-devices-mapper";
import { mapCreateLightingGroupsToHttp } from "../mappers/create-lighting-groups-mapper";
import { mapDecommissioningLightingDevicesToHttp } from "../mappers/decommissioning-lighting-devices-mapper";
import { mapGetLightingDeviceToHttp } from "../mappers/get-lighting-device-mapper";
import { mapGetLightingGroupToHttp } from "../mappers/get-lighting-group-mapper";
import { mapMoveLightingDevicesToGroupToHttp } from "../mappers/move-lighting-devices-to-group-mapper";
import { mapRemoveLightingDevicesFromGroupToHttp } from "../mappers/remove-lighting-devices-from-group-mapper";
import { mapTurnOffGroupToHttp } from "../mappers/turn-off-group-mapper";
import { mapTurnOnGroupToHttp } from "../mappers/turn-on-group-mapper";
import {
  mapUpdateProductDataLightingDevicesToApp,
  mapUpdateProductDataLightingDevicesToHttp,
} from "../mappers/update-product-data-lighting-device-mapper";
import addLightingDevicesInGroupBodySchema from "../schemas/lighting/add-lighting-devices-in-group.body.json";
import addLightingDevicesInGroupReplySchema from "../schemas/lighting/add-lighting-devices-in-group.reply.json";
import createLightingDevicesBodySchema from "../schemas/lighting/create-lighting-devices.body.json";
import createLightingDevicesReplaySchema from "../schemas/lighting/create-lighting-devices.reply.json";
import createLightingGroupsBodySchema from "../schemas/lighting/create-lighting-groups.body.json";
import createLightingGroupsReplySchema from "../schemas/lighting/create-lighting-groups.reply.json";
import decommissioningLightingDevicesBodySchema from "../schemas/lighting/decommissioning-lighting-devices.body.json";
import decommissioningLightingDevicesReplaySchema from "../schemas/lighting/decommissioning-lighting-devices.reply.json";
import getLightingDeviceQuerystringSchema from "../schemas/lighting/get-lighting-device.querystring.json";
import getLightingDeviceReplySchema from "../schemas/lighting/get-lighting-device.reply.json";
import getLightingDevicesReplySchema from "../schemas/lighting/get-lighting-devices.reply.json";
import getLightingGroupQuerystringSchema from "../schemas/lighting/get-lighting-group.querystring.json";
import getLightingGroupReplySchema from "../schemas/lighting/get-lighting-group.reply.json";
import getLightingGroupsReplySchema from "../schemas/lighting/get-lighting-groups.reply.json";
import lightingDeviceSchema from "../schemas/lighting/lighting-device.json";
import lightingGroupSchema from "../schemas/lighting/lighting-group.json";
import moveLightingDevicesToAnotherGroupBodySchema from "../schemas/lighting/move-lighting-devices-to-another-group.body.json";
import moveLightingDevicesToAnotherGroupReplySchema from "../schemas/lighting/move-lighting-devices-to-another-group.reply.json";
import removeLightingDevicesFromGroupBodySchema from "../schemas/lighting/remove-lighting-devices-from-group.body.json";
import removeLightingDevicesFromGroupReplySchema from "../schemas/lighting/remove-lighting-devices-from-group.reply.json";
import turnOffGroupBodySchema from "../schemas/lighting/turn-off-group.body.json";
import turnOffGroupReplySchema from "../schemas/lighting/turn-off-group.reply.json";
import turnOnGroupBodySchema from "../schemas/lighting/turn-on-group.body.json";
import turnOnGroupReplySchema from "../schemas/lighting/turn-on-group.reply.json";
import updateProductDataLightingDevicessBodySchema from "../schemas/lighting/update-product-data-lighting-devices.body.json";
import updateProductDataLightingDevicessReplaySchema from "../schemas/lighting/update-product-data-lighting-devices.reply.json";
import { AddLightingDevicesInGroupBodySchema } from "../types/lighting/add-lighting-devices-in-group.body";
import { AddLightingDevicesInGroupReplySchema } from "../types/lighting/add-lighting-devices-in-group.reply";
import { CreateLightingDevicesBodySchema } from "../types/lighting/create-lighting-devices.body";
import { CreateLightingDevicesReplySchema } from "../types/lighting/create-lighting-devices.reply";
import { CreateLightingGroupsBodySchema } from "../types/lighting/create-lighting-groups.body";
import { CreateLightingGroupReplySchema } from "../types/lighting/create-lighting-groups.reply";
import { DecommissioningLightingDevicesBodySchema } from "../types/lighting/decommissioning-lighting-devices.body";
import { DecommissioningLightingDeviceReplySchema } from "../types/lighting/decommissioning-lighting-devices.reply";
import { GetLightingDeviceQuerystringSchema } from "../types/lighting/get-lighting-device.querystring";
import { GetLightingDeviceReplySchema } from "../types/lighting/get-lighting-device.reply";
import { GetLightingDevicesReplySchema } from "../types/lighting/get-lighting-devices.reply";
import { GetLightingGroupQuerystringSchema } from "../types/lighting/get-lighting-group.querystring";
import { GetLightingGroupReplySchema } from "../types/lighting/get-lighting-group.reply";
import { GetLightingGroupsReplySchema } from "../types/lighting/get-lighting-groups.reply";
import { MoveLightingDevicesToAnotherGroupBodySchema } from "../types/lighting/move-lighting-devices-to-another-group.body";
import { MoveLightingDevicesToAnotherGroupReplySchema } from "../types/lighting/move-lighting-devices-to-another-group.reply";
import { RemoveLightingDevicesFromGroupBodySchema } from "../types/lighting/remove-lighting-devices-from-group.body";
import { RemoveLightingDevicesFromGroupReplySchema } from "../types/lighting/remove-lighting-devices-from-group.reply";
import { TurnOffGroupBodySchema } from "../types/lighting/turn-off-group.body";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";
import { TurnOnGroupBodySchema } from "../types/lighting/turn-on-group.body";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";
import { UpdateProductDataLightingDevicesBodySchema } from "../types/lighting/update-product-data-lighting-devices.body";
import { UpdateProductDataLightingDevicesReplySchema } from "../types/lighting/update-product-data-lighting-devices.reply";

export type lightingFastifyPluginOptions = {
  logger: Logger;
  lightingRepository: ILightingRepository;
  config: Config;
  rethinkdbConnection: Connection;
};

const lighting: FastifyPluginAsync<lightingFastifyPluginOptions> = async (
  fastify,
  options,
): Promise<void> => {
  const logger = options.logger.child({ name: "fastify-lighting-router" });

  const { lightingRepository } = options;

  fastify.addSchema(lightingDeviceSchema);
  fastify.addSchema(lightingGroupSchema);

  fastify.route<{
    Body: CreateLightingDevicesBodySchema;
    Reply: CreateLightingDevicesReplySchema;
  }>({
    method: "PUT",
    url: "/create-lighting-devices",
    schema: {
      body: createLightingDevicesBodySchema,
      response: {
        [HttpStatusCodes.OK]: createLightingDevicesReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const devices = request.body;

      const createLightingDevicesCommand = getCreateLightingDevicesCommand(lightingRepository);

      const lightingDevices = await createLightingDevicesCommand({
        devices: mapCreateLightingDevicesToApp(devices),
      });

      if (lightingDevices instanceof Error) {
        logger.error({ devices, error: lightingDevices }, "Lighting devices wasn't created");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapCreateLightingDevicesToHttp(lightingDevices));
    },
  });

  fastify.route<{
    Reply: GetLightingDevicesReplySchema;
  }>({
    method: "GET",
    url: "/get-lighting-devices",
    schema: {
      response: {
        [HttpStatusCodes.OK]: getLightingDevicesReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const getLightingDevicesCommand = getGetLightingDevicesCommand(lightingRepository);

      const lightingDevices = await getLightingDevicesCommand();

      if (lightingDevices instanceof Error) {
        logger.error({ error: lightingDevices }, "Lighting devices wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(lightingDevices.map(mapGetLightingDeviceToHttp));
    },
  });

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

      if (lightingDevice instanceof Error) {
        logger.error({ deviceId, error: lightingDevice }, "Lighting device wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightingDeviceToHttp(lightingDevice));
    },
  });

  fastify.route<{
    Body: UpdateProductDataLightingDevicesBodySchema;
    Reply: UpdateProductDataLightingDevicesReplySchema;
  }>({
    method: "POST",
    url: "/update-product-data-lighting-devices",
    schema: {
      body: updateProductDataLightingDevicessBodySchema,
      response: {
        [HttpStatusCodes.OK]: updateProductDataLightingDevicessReplaySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const devices = request.body;

      const updateLightingDevicesCommand =
        getUpdateProductDataLightingDevicesCommand(lightingRepository);

      const lightingDevices = await updateLightingDevicesCommand({
        devices: mapUpdateProductDataLightingDevicesToApp(devices),
      });

      if (lightingDevices instanceof Error) {
        logger.error({ devices, error: lightingDevices }, "Lighting devices wasn't updated");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply
        .code(HttpStatusCodes.OK)
        .send(mapUpdateProductDataLightingDevicesToHttp(lightingDevices));
    },
  });

  fastify.route<{
    Body: DecommissioningLightingDevicesBodySchema;
    Reply: DecommissioningLightingDeviceReplySchema;
  }>({
    method: "POST",
    url: "/decommissioning-lighting-devices",
    schema: {
      body: decommissioningLightingDevicesBodySchema,
      response: {
        [HttpStatusCodes.OK]: decommissioningLightingDevicesReplaySchema,
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

      if (lightingDevices instanceof Error) {
        logger.error(
          { deviceIds, error: lightingDevices },
          "Lighting devices wasn't decommissioned",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapDecommissioningLightingDevicesToHttp(lightingDevices));
    },
  });

  fastify.route<{
    Body: CreateLightingGroupsBodySchema;
    Reply: CreateLightingGroupReplySchema;
  }>({
    method: "PUT",
    url: "/create-lighting-groups",
    schema: {
      body: createLightingGroupsBodySchema,
      response: {
        [HttpStatusCodes.OK]: createLightingGroupsReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocations } = request.body;

      const createLightingGroupsCommand = getCreateLightingGroupCommand(lightingRepository);

      const lightingGroups = await createLightingGroupsCommand({ lightingGroupLocations });

      if (lightingGroups instanceof Error) {
        logger.error(
          { lightingGroupLocations, error: lightingGroups },
          "Lighting group wasn't created",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapCreateLightingGroupsToHttp(lightingGroups));
    },
  });

  fastify.route<{
    Reply: GetLightingGroupsReplySchema;
  }>({
    method: "GET",
    url: "/get-lighting-groups",
    schema: {
      response: {
        [HttpStatusCodes.OK]: getLightingGroupsReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const getLightingGroupsCommand = getGetLightingGroupsCommand(lightingRepository);

      const lightingGroups = await getLightingGroupsCommand();

      if (lightingGroups instanceof Error) {
        logger.error({ error: lightingGroups }, "Lighting groups wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(lightingGroups.map(mapGetLightingGroupToHttp));
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

      if (lightingGroup instanceof Error) {
        logger.error({ groupId, error: lightingGroup }, "Lighting group wasn't found");

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapGetLightingGroupToHttp(lightingGroup));
    },
  });

  fastify.route<{
    Body: AddLightingDevicesInGroupBodySchema;
    Reply: AddLightingDevicesInGroupReplySchema;
  }>({
    method: "POST",
    url: "/add-lighting-devices-in-group",
    schema: {
      body: addLightingDevicesInGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: addLightingDevicesInGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocation, deviceIds } = request.body;

      const addLightingDevicesIntoGroupCommand =
        getAddLightingDevicesIntoGroupCommand(lightingRepository);

      const lightingGroup = await addLightingDevicesIntoGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (lightingGroup instanceof Error) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightingGroup },
          "Lighting device wasn't added to lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapAddLightingDevicesInGroupToHttp(lightingGroup));
    },
  });

  fastify.route<{
    Body: RemoveLightingDevicesFromGroupBodySchema;
    Reply: RemoveLightingDevicesFromGroupReplySchema;
  }>({
    method: "POST",
    url: "/remove-lighting-devices-from-group",
    schema: {
      body: removeLightingDevicesFromGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: removeLightingDevicesFromGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocation, deviceIds } = request.body;

      const removeLightingDevicesFromGroupCommand =
        getRemoveLightingDeviceFromGroupCommand(lightingRepository);

      const lightingGroup = await removeLightingDevicesFromGroupCommand({
        lightingGroupLocation,
        deviceIds,
      });

      if (lightingGroup instanceof Error) {
        logger.error(
          { lightingGroupLocation, deviceIds, error: lightingGroup },
          "Lighting device wasn't removed from lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapRemoveLightingDevicesFromGroupToHttp(lightingGroup));
    },
  });

  fastify.route<{
    Body: MoveLightingDevicesToAnotherGroupBodySchema;
    Reply: MoveLightingDevicesToAnotherGroupReplySchema;
  }>({
    method: "POST",
    url: "/move-lighting-device-to-group",
    schema: {
      body: moveLightingDevicesToAnotherGroupBodySchema,
      response: {
        [HttpStatusCodes.OK]: moveLightingDevicesToAnotherGroupReplySchema,
      },
      tags: ["lighting"],
    },
    handler: async (request, reply) => {
      const { lightingGroupLocationFrom, lightingGroupLocationTo, deviceIds } = request.body;

      const moveLightingDeviceToAnotherGroupCommand =
        getMoveLightingDevicesToAnotherGroupCommand(lightingRepository);

      const result = await moveLightingDeviceToAnotherGroupCommand({
        lightingGroupLocationFrom,
        lightingGroupLocationTo,
        deviceIds,
      });

      if (result instanceof Error) {
        logger.error(
          {
            lightingGroupLocationFrom,
            lightingGroupLocationTo,
            deviceIds,
            errors: result,
          },
          "Lighting device wasn't moved from lighting group",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapMoveLightingDevicesToGroupToHttp(result));
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

      if (lightingGroup instanceof Error) {
        logger.error(
          {
            lightingGroupLocation,
            errors: lightingGroup,
          },
          "Lighting group wasn't turned on",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapTurnOnGroupToHttp(lightingGroup));
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

      if (lightingGroup instanceof Error) {
        logger.error(
          {
            lightingGroupLocation,
            errors: lightingGroup,
          },
          "Lighting group wasn't turned off",
        );

        return reply.code(HttpStatusCodes.UNPROCESSABLE_ENTITY).send();
      }

      reply.code(HttpStatusCodes.OK).send(mapTurnOffGroupToHttp(lightingGroup));
    },
  });

  if (options.config.rethinkdb.purgeTestDatabase && !options.config.production) {
    fastify.route({
      method: "POST",
      url: "/purge-test-database",
      schema: {
        tags: ["lighting"],
      },
      handler: async (request, reply) => {
        try {
          await lightingDeviceTable.delete().run(options.rethinkdbConnection);
          await lightingGroupTable.delete().run(options.rethinkdbConnection);
        } catch (error) {
          logger.error(error, "Test database was not purged 🚨");

          return reply.code(HttpStatusCodes.INTERNAL_SERVER_ERROR).send();
        }

        logger.info("Test database was purged successful ✅");

        reply.code(HttpStatusCodes.OK).send();
      },
    });
  }
};

export const lightingFastifyPlugin = fp(lighting, {
  fastify: "3.x",
  name: "fastify-lighting-router",
});

export default lightingFastifyPlugin;

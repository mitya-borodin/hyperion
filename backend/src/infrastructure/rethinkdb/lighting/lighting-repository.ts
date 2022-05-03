import { Either, isRight, left, right } from "fp-ts/Either";
import { Logger } from "pino";
import { Connection, r, RDatum } from "rethinkdb-ts";

import { LightingDevice, LightingDeviceState } from "../../../domain/lighting/lighting-device";
import { LightingGroup, LightingGroupState } from "../../../domain/lighting/lighting-group";
import {
  CreateLightingDevice,
  ILightingRepository,
  UpdateLightingDevice,
} from "../../../domain/lighting/lighting-repository";
import { LightingDeviceTable, lightingDeviceTable } from "../tables/lighting-device";
import { LightingGroupTable, lightingGroupTable } from "../tables/lighting-group";

export class LightingRepository implements ILightingRepository {
  private readonly rethinkdbConnection: Connection;
  private readonly logger: Logger;

  constructor(rethinkdbConnection: Connection, logger: Logger) {
    this.rethinkdbConnection = rethinkdbConnection;
    this.logger = logger.child({ name: "lighting-repository" });
  }
  async createLightingDevices(
    devices: CreateLightingDevice[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .insert(
        devices.map((device) => ({
          id: r.uuid(),
          name: device.name,
          brand: device.brand,
          power: device.power,
          lumens: device.lumens,
          lightTemperatureKelvin: device.lightTemperatureKelvin,
          resourceMs: device.resourceMs,
          price: device.price,
          currency: device.currency,
          sellersWebsite: device.sellersWebsite,
          images: device.images,
          placeOfInstallation: device.placeOfInstallation,
          state: device.state,
          history: [],
          totalWorkedMs: 0,
          createdAt: r.now(),
          updatedAt: r.now(),
        })),
        { returnChanges: "always" },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "Lighting devices wasn't created");

      return left(new Error("INSERT_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ devices, writeResult }, "Lighting devices was created successful");

    return right(result);
  }

  async updateLightingDevice(
    devices: UpdateLightingDevice[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .insert(
        devices.map((device) => ({
          id: device.id,
          name: device.name,
          brand: device.brand,
          power: device.power,
          lumens: device.lumens,
          lightTemperatureKelvin: device.lightTemperatureKelvin,
          resourceMs: device.resourceMs,
          price: device.price,
          currency: device.currency,
          sellersWebsite: device.sellersWebsite,
          images: device.images,
          placeOfInstallation: device.placeOfInstallation,
          updateAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(id, oldDoc: RDatum<LightingDeviceTable>, newDoc: RDatum<UpdateLightingDevice>) {
            return oldDoc.merge(newDoc);
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "Lighting devices wasn't updated");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ devices, writeResult }, "Lighting devices was updated successful");

    return right(result);
  }

  async decommissioningLightingDevices(
    deviceIds: string[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .getAll(...deviceIds)
      .update(
        { state: LightingDeviceState.DECOMMISSIONED, updatedAt: new Date().toJSON() },
        { returnChanges: "always" },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ deviceIds, writeResult }, "Lighting devices wasn't decommissioned");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ deviceIds, writeResult }, "Lighting devices was updated successful");

    return right(result);
  }

  async getLightningDevice(deviceId: string): Promise<Either<Error, LightingDevice | null>> {
    const readResult = await lightingDeviceTable.get(deviceId).run(this.rethinkdbConnection);

    return right(readResult);
  }

  async initializeLightingGroup(locations: string[]): Promise<Either<Error, LightingGroup[]>> {
    const writeResult = await lightingGroupTable
      .insert(
        locations.map((location) => ({
          location,
          state: LightingGroupState.OFF,
          devices: [],
          createdAt: r.now(),
          updateAt: r.now(),
        })),
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ locations, writeResult }, "Lighting groups wasn't init");

      return left(new Error("INSERT_FAILED"));
    }

    // ! LightingGroupTable совпадает с LightingGroup, по этому адаптер не нужен
    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ locations, writeResult }, "Lighting devices was updated successful");

    return right(result);
  }

  async addLightingDeviceIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>> {
    const writeResult = await lightingGroupTable
      .getAll(location)
      .update(
        (row: RDatum<LightingGroupTable>) => {
          const unionDeviceIds = row("deviceIds").setUnion(deviceIds);

          return r.branch(
            row("deviceIds").count().eq(unionDeviceIds.count()),
            row,
            row.merge({
              deviceIds: unionDeviceIds,
              updatedAt: new Date().toJSON(),
            }),
          );
        },
        {
          returnChanges: "always",
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error(
        { location, deviceIds, writeResult },
        "Device ids wasn't added to lighting group",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingGroupTable совпадает с LightingGroup, по этому адаптер не нужен
    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    if (result.length === 0) {
      this.logger.error(
        { location, deviceIds, writeResult },
        "Device ids wasn't added to lighting group",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, deviceIds, writeResult },
      "Lighting devices was updated successful",
    );

    return right(result[0]);
  }

  async removeLightingDeviceFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>> {
    const writeResult = await lightingGroupTable
      .getAll(location)
      .update(
        (row: RDatum<LightingGroupTable>) => {
          const differenceDeviceIds = row("deviceIds").setDifference(deviceIds);

          return r.branch(
            row("deviceIds").count().eq(differenceDeviceIds.count()),
            row,
            row.merge({
              deviceIds: differenceDeviceIds,
              updatedAt: new Date().toJSON(),
            }),
          );
        },
        {
          returnChanges: "always",
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error(
        { location, deviceIds, writeResult },
        "Device ids wasn't removed to lighting group",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingGroupTable совпадает с LightingGroup, по этому адаптер не нужен
    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    if (result.length === 0) {
      this.logger.error(
        { location, deviceIds, writeResult },
        "Device ids wasn't removed to lighting group",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, deviceIds, writeResult },
      "Lighting devices was updated successful",
    );

    return right(result[0]);
  }

  async moveLightingDeviceToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<Either<[Error, Error], [LightingGroup, LightingGroup]>> {
    const lightingGroupFrom = await this.removeLightingDeviceFromGroup(locationFrom, deviceIds);
    const lightingGroupTo = await this.addLightingDeviceIntoGroup(locationTo, deviceIds);

    if (isRight(lightingGroupFrom) && isRight(lightingGroupTo)) {
      this.logger.debug(
        { locationFrom, locationTo, deviceIds },
        "Lighting devices was moved successful",
      );

      return right([lightingGroupFrom.right, lightingGroupTo.right]);
    }

    this.logger.error({ locationFrom, locationTo, deviceIds }, "Lighting devices wasn't moved ");

    return left([new Error("MOVE_FAILED"), new Error("MOVE_FAILED")]);
  }

  async turnOnGroup(location: string): Promise<Either<Error, LightingGroup>> {
    return this.toggleGroup(location, LightingGroupState.ON);
  }

  async turnOffGroup(location: string): Promise<Either<Error, LightingGroup>> {
    return this.toggleGroup(location, LightingGroupState.OFF);
  }

  async getLightningGroup(groupId: string): Promise<Either<Error, LightingGroup | null>> {
    const readResult = await lightingGroupTable.get(groupId).run(this.rethinkdbConnection);

    return right(readResult);
  }

  private async toggleGroup(
    location: string,
    state: LightingGroupState,
  ): Promise<Either<Error, LightingGroup>> {
    const writeResult = await lightingGroupTable
      .getAll(location)
      .update(
        { state },
        {
          returnChanges: "always",
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ location, state, writeResult }, "Lighting group wasn't turned");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingGroupTable совпадает с LightingGroup, по этому адаптер не нужен
    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    if (result.length === 0) {
      this.logger.error({ location, state, writeResult }, "Lighting group wasn't turned");

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug({ location, state, writeResult }, "Lighting group was turned successful");

    return right(result[0]);
  }
}

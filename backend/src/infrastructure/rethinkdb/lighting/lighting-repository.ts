import { Either, isLeft, isRight, left, right } from "fp-ts/Either";
import { Logger } from "pino";
import { Connection, r, RDatum } from "rethinkdb-ts";

import {
  LightingDevice,
  LightingDeviceState,
  PlaceOfInstallationOfTheLightingDevice,
} from "../../../domain/lighting/lighting-device";
import { LightingGroup, LightingGroupState } from "../../../domain/lighting/lighting-group";
import {
  CreateLightingDevice,
  ILightingRepository,
  UpdateProductDataLightingDevice,
  UpdatePlaceOfInstallationLightingDevice,
  UpdateSateLightingDevice,
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
  async getLightingDevices(): Promise<Either<Error, LightingDevice[]>> {
    const readResult = await lightingDeviceTable.run(this.rethinkdbConnection);

    return right(readResult);
  }

  async getLightingDevice(deviceId: string): Promise<Either<Error, LightingDevice | null>> {
    const readResult = await lightingDeviceTable.get(deviceId).run(this.rethinkdbConnection);

    return right(readResult);
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
          placeOfInstallation: PlaceOfInstallationOfTheLightingDevice.NOT_INSTALLED,
          state: LightingDeviceState.IN_STOCK,
          history: [],
          totalWorkedMs: 0,
          createdAt: r.now(),
          updatedAt: r.now(),
        })),
        { returnChanges: "always" },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "Lighting devices wasn't created 🚨");

      return left(new Error("INSERT_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ devices, writeResult }, "Lighting devices was created successful ✅");

    return right(result);
  }

  async updateProductDataLightingDevices(
    devices: UpdateProductDataLightingDevice[],
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
          updateAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(
            id,
            oldDoc: RDatum<UpdateProductDataLightingDevice>,
            newDoc: RDatum<UpdateProductDataLightingDevice>,
          ) {
            return oldDoc.merge(newDoc);
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "Lighting devices wasn't updated 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ devices, writeResult }, "Lighting devices was updated successful ✅");

    return right(result);
  }

  private async updatePlaceOfInstallationLightingDevices(
    devices: UpdatePlaceOfInstallationLightingDevice[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .insert(
        devices.map((device) => ({
          id: device.id,
          placeOfInstallation: device.placeOfInstallation,
          updateAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(
            id,
            oldDoc: RDatum<UpdatePlaceOfInstallationLightingDevice>,
            newDoc: RDatum<UpdatePlaceOfInstallationLightingDevice>,
          ) {
            if (oldDoc("placeOfInstallation").eq(newDoc("placeOfInstallation")).not()) {
              return oldDoc.merge(newDoc).merge({
                history: newDoc("history").setInsert({
                  placeOfInstallation: newDoc("placeOfInstallation"),
                  turnedOnAt: null,
                  turnedOffAt: null,
                  workedMs: null,
                }),
              });
            }

            return oldDoc.merge(newDoc);
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error(
        { devices, writeResult },
        "Place of installation lighting devices wasn't updated 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug(
      { devices, writeResult },
      "Place of installation lighting devices was updated successful ✅",
    );

    return right(result);
  }

  private async updateStateLightingDevices(
    devices: UpdateSateLightingDevice[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .insert(
        devices.map((device) => ({
          id: device.id,
          state: device.state,
          updateAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(
            id,
            oldDoc: RDatum<UpdatePlaceOfInstallationLightingDevice>,
            newDoc: RDatum<UpdatePlaceOfInstallationLightingDevice>,
          ) {
            if (
              newDoc("state")
                .eq(LightingDeviceState.IN_STOCK)
                .or(newDoc("state").eq(LightingDeviceState.DECOMMISSIONED))
            ) {
              return oldDoc;
            }

            if (
              newDoc("state")
                .eq(LightingDeviceState.ON)
                .and(
                  oldDoc("state")
                    .eq(LightingDeviceState.OFF)
                    .or(oldDoc("state").eq(LightingDeviceState.IN_STOCK)),
                )
            ) {
              return oldDoc.merge(newDoc).merge({
                history: newDoc("history").setInsert({
                  placeOfInstallation: null,
                  turnedOnAt: r.now(),
                  turnedOffAt: null,
                  workedMs: null,
                }),
              });
            }

            if (
              newDoc("state")
                .eq(LightingDeviceState.OFF)
                .and(oldDoc("state").eq(LightingDeviceState.ON))
            ) {
              const lastHistoryIndex = newDoc("history").count().sub(1);
              const lastHistoryItem = newDoc("history")(lastHistoryIndex);

              const turnedOnAt = lastHistoryItem("turnedOnAt");
              const turnedOffAt = r.now();
              const workedMs = turnedOffAt.sub(turnedOnAt).seconds().mul(1_000);

              return oldDoc.merge(newDoc).merge({
                history: newDoc("history")(lastHistoryIndex).merge({
                  placeOfInstallation: null,
                  turnedOnAt,
                  turnedOffAt,
                  workedMs,
                }),
                totalWorkedMs: newDoc("totalWorkedMs").add(workedMs),
              });
            }

            return oldDoc;
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "State of lighting devices wasn't updated 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug(
      { devices, writeResult },
      "State of lighting devices was updated successful ✅",
    );

    return right(result);
  }

  async decommissioningLightingDevices(
    deviceIds: string[],
  ): Promise<Either<Error, LightingDevice[]>> {
    const writeResult = await lightingDeviceTable
      .getAll(...deviceIds)
      .update(
        (lightingDevice: RDatum<LightingDevice>) => {
          return lightingDevice.merge({
            placeOfInstallation: PlaceOfInstallationOfTheLightingDevice.NOT_INSTALLED,
            state: LightingDeviceState.DECOMMISSIONED,
            history: lightingDevice("history").setInsert({
              placeOfInstallation: PlaceOfInstallationOfTheLightingDevice.NOT_INSTALLED,
              turnedOnAt: null,
              turnedOffAt: null,
              workedMs: null,
            }),
            updatedAt: new Date().toJSON(),
          });
        },
        { returnChanges: "always" },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ deviceIds, writeResult }, "Lighting devices wasn't decommissioned 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

    // ! LightingDeviceTable совпадает с LightingDevice, по этому адаптер не нужен
    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ deviceIds, writeResult }, "Lighting devices was updated successful ✅");

    return right(result);
  }

  async getLightingGroups(): Promise<Either<Error, LightingGroup[]>> {
    const readResult = await lightingGroupTable.run(this.rethinkdbConnection);

    return right(readResult);
  }

  async getLightingGroup(groupId: string): Promise<Either<Error, LightingGroup | null>> {
    const readResult = await lightingGroupTable.get(groupId).run(this.rethinkdbConnection);

    return right(readResult);
  }

  async initializeLightingGroups(locations: string[]): Promise<Either<Error, LightingGroup[]>> {
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
      this.logger.error({ locations, writeResult }, "Lighting groups wasn't init 🚨");

      return left(new Error("INSERT_FAILED"));
    }

    // ! LightingGroupTable совпадает с LightingGroup, по этому адаптер не нужен
    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ locations, writeResult }, "Lighting devices was updated successful ✅");

    return right(result);
  }

  async addLightingDevicesIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
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
        "Device ids wasn't added to lighting group 🚨",
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
        "Device ids wasn't added to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, deviceIds, writeResult },
      "Lighting devices was updated successful ✅",
    );

    const updatePlaceOfInstallationLightingDevicesResult =
      await this.updatePlaceOfInstallationLightingDevices(
        deviceIds.map((deviceId) => {
          return { id: deviceId, placeOfInstallation: location };
        }),
      );

    if (isLeft(updatePlaceOfInstallationLightingDevicesResult)) {
      return left(new Error("UPDATE_FAILED"));
    }

    return right([result[0], updatePlaceOfInstallationLightingDevicesResult.right]);
  }

  async removeLightingDevicesFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
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
        "Device ids wasn't removed to lighting group 🚨",
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
        "Device ids wasn't removed to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, deviceIds, writeResult },
      "Lighting devices was updated successful ✅",
    );

    const updatePlaceOfInstallationLightingDevicesResult =
      await this.updatePlaceOfInstallationLightingDevices(
        deviceIds.map((deviceId) => {
          return { id: deviceId, placeOfInstallation: "NOT_INSTALLED" };
        }),
      );

    if (isLeft(updatePlaceOfInstallationLightingDevicesResult)) {
      return left(new Error("UPDATE_FAILED"));
    }

    return right([result[0], updatePlaceOfInstallationLightingDevicesResult.right]);
  }

  async moveLightingDevicesToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    const lightingGroupFrom = await this.removeLightingDevicesFromGroup(locationFrom, deviceIds);
    const lightingGroupTo = await this.addLightingDevicesIntoGroup(locationTo, deviceIds);

    if (isRight(lightingGroupFrom) && isRight(lightingGroupTo)) {
      this.logger.debug(
        { locationFrom, locationTo, deviceIds },
        "Lighting devices was moved successful ✅",
      );

      return right(lightingGroupTo.right);
    }

    this.logger.error({ locationFrom, locationTo, deviceIds }, "Lighting devices wasn't moved 🚨");

    return left(new Error("MOVE_FAILED"));
  }

  async turnOnGroup(location: string): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    return this.toggleGroup(location, LightingGroupState.ON);
  }

  async turnOffGroup(location: string): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    return this.toggleGroup(location, LightingGroupState.OFF);
  }

  private async toggleGroup(
    location: string,
    state: LightingGroupState,
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
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
      this.logger.error({ location, state, writeResult }, "Lighting group wasn't turned 🚨");

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
      this.logger.error({ location, state, writeResult }, "Lighting group wasn't turned 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug({ location, state, writeResult }, "Lighting group was turned successful ✅");

    const lightingGroup = result[0];

    const updateStateLightingDevicesResult = await this.updateStateLightingDevices(
      lightingGroup.devices.map((deviceId) => {
        if (state === LightingGroupState.ON) {
          return { id: deviceId, state: LightingDeviceState.ON };
        }

        if (state === LightingGroupState.OFF) {
          return { id: deviceId, state: LightingDeviceState.OFF };
        }

        return { id: deviceId, state: LightingDeviceState.OFF };
      }),
    );

    if (isLeft(updateStateLightingDevicesResult)) {
      return left(new Error("UPDATE_FAILED"));
    }

    return right([lightingGroup, updateStateLightingDevicesResult.right]);
  }
}

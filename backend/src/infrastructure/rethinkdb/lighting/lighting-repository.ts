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
          updatedAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(
            id,
            oldDoc: RDatum<LightingDevice>,
            newDoc: RDatum<UpdateProductDataLightingDevice>,
          ) {
            return oldDoc.merge(newDoc);
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error(
        { devices, writeResult },
        "Lighting devices product data wasn't updated 🚨",
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
      "Lighting devices product data was updated successful ✅",
    );

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
          updatedAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(
            id,
            oldDoc: RDatum<LightingDevice>,
            newDoc: RDatum<UpdatePlaceOfInstallationLightingDevice>,
          ) {
            if (oldDoc("placeOfInstallation").eq(newDoc("placeOfInstallation")).not()) {
              const historyIsEmpty = oldDoc("history").count().eq(0);

              const lastHistoryIndex = oldDoc("history").count().sub(1);
              const lastHistoryItem = oldDoc("history")(lastHistoryIndex);

              const placeOfInstallation = newDoc("placeOfInstallation");

              return oldDoc.merge(newDoc).merge({
                history: oldDoc("history").setInsert(
                  r.branch(
                    historyIsEmpty,
                    {
                      placeOfInstallation,
                      turnedOnAt: null,
                      turnedOffAt: null,
                      workedMs: null,
                    },
                    lastHistoryItem.merge({
                      placeOfInstallation,
                    }),
                  ),
                ),
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
          updatedAt: r.now(),
        })),
        {
          returnChanges: "always",
          conflict(id, oldDoc: RDatum<LightingDevice>, newDoc: RDatum<UpdateSateLightingDevice>) {
            return r.branch(
              newDoc("state")
                .eq(LightingDeviceState.IN_STOCK)
                .or(newDoc("state").eq(LightingDeviceState.DECOMMISSIONED)),
              oldDoc,
              newDoc("state")
                .eq(LightingDeviceState.ON)
                .and(
                  oldDoc("state")
                    .eq(LightingDeviceState.OFF)
                    .or(oldDoc("state").eq(LightingDeviceState.IN_STOCK)),
                )
                .and(oldDoc("history").count().gt(0)),
              r.do(oldDoc, newDoc, (oldDoc, newDoc) => {
                const lastHistoryIndex = oldDoc("history").count().sub(1);
                const lastHistoryItem = oldDoc("history")(lastHistoryIndex);

                return oldDoc.merge(newDoc).merge({
                  history: oldDoc("history").setInsert(
                    lastHistoryItem.merge({
                      turnedOnAt: r.now(),
                    }),
                  ),
                });
              }),
              newDoc("state")
                .eq(LightingDeviceState.OFF)
                .and(oldDoc("state").eq(LightingDeviceState.ON))
                .and(oldDoc("history").count().gt(0)),
              r.do(oldDoc, newDoc, (oldDoc, newDoc) => {
                const lastHistoryIndex = oldDoc("history").count().sub(1);
                const lastHistoryItem = oldDoc("history")(lastHistoryIndex);

                const turnedOnAt = lastHistoryItem("turnedOnAt");
                const turnedOffAt = r.now();

                const workedMs = turnedOffAt
                  .sub(r.branch(turnedOnAt.eq(null), r.now(), r.expr(turnedOnAt)))
                  .seconds()
                  .mul(1_000);

                return oldDoc.merge(newDoc).merge({
                  history: lastHistoryItem.merge({
                    turnedOffAt,
                    workedMs,
                  }),
                  totalWorkedMs: oldDoc("totalWorkedMs").add(workedMs),
                });
              }),
              oldDoc,
            );
          },
        },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ devices, writeResult }, "State of lighting devices wasn't updated 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

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
    await this.updateStateLightingDevices(
      deviceIds.map((deviceId) => ({ id: deviceId, state: LightingDeviceState.OFF })),
    );

    // TODO Удалить устройства из групп, по placeOfInstallation, перед тем как менять состояние на DECOMMISSIONED
    // TODO Используя this.removeLightingDevicesFromGroup(location: string, deviceIds: string[])

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

    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug(
      { deviceIds, writeResult },
      "Lighting devices was decommissioned successful ✅",
    );

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

  async createLightingGroups(locations: string[]): Promise<Either<Error, LightingGroup[]>> {
    const writeResult = await lightingGroupTable
      .insert(
        locations.map((location) => ({
          location,
          state: LightingGroupState.OFF,
          devices: [],
          createdAt: r.now(),
          updatedAt: r.now(),
        })),
        { returnChanges: "always" },
      )
      .run(this.rethinkdbConnection);

    if (!writeResult.changes || writeResult.first_error) {
      this.logger.error({ locations, writeResult }, "Lighting groups wasn't created 🚨");

      return left(new Error("INSERT_FAILED"));
    }

    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ locations, writeResult }, "Lighting groups was created successful ✅");

    return right(result);
  }

  // TODO Добавить перемещение группы
  // TODO Добавить удаление группы

  async addLightingDevicesIntoGroup(
    location: string,
    devices: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    const writeResult = await lightingGroupTable
      .getAll(location)
      .update(
        (lightingGroup: RDatum<LightingGroupTable>) => {
          const unionDeviceIds = lightingGroup("devices").setUnion(devices);

          return r.branch(
            lightingGroup("devices").count().eq(unionDeviceIds.count()),
            lightingGroup,
            lightingGroup.merge({
              devices: unionDeviceIds,
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
        { location, devices, writeResult },
        "Devices wasn't added to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    const result: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    if (result.length === 0) {
      this.logger.error(
        { location, devices, writeResult },
        "Devices wasn't added to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, devices, writeResult },
      "Lighting devices was add in lighting group successful ✅",
    );

    const lightingGroup = result[0];

    const updatePlaceOfInstallationLightingDevicesResult =
      await this.updatePlaceOfInstallationLightingDevices(
        devices.map((device) => {
          let state = LightingDeviceState.OFF;

          if (lightingGroup.state === LightingGroupState.ON) {
            state = LightingDeviceState.ON;
          }

          return { id: device, state, placeOfInstallation: location };
        }),
      );

    if (isLeft(updatePlaceOfInstallationLightingDevicesResult)) {
      return left(new Error("UPDATE_FAILED"));
    }

    return right([lightingGroup, updatePlaceOfInstallationLightingDevicesResult.right]);
  }

  async removeLightingDevicesFromGroup(
    location: string,
    devices: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    const writeResult = await lightingGroupTable
      .getAll(location)
      .update(
        (row: RDatum<LightingGroupTable>) => {
          const differenceDeviceIds = row("devices").setDifference(devices);

          return r.branch(
            row("devices").count().eq(differenceDeviceIds.count()),
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
        { location, devices, writeResult },
        "Device ids wasn't removed to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }
    const lightingGroups: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        lightingGroups.push(new_val);
      }
    });

    if (lightingGroups.length === 0) {
      this.logger.error(
        { location, devices, writeResult },
        "Device ids wasn't removed to lighting group 🚨",
      );

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug(
      { location, devices, writeResult },
      "Lighting devices was removed from lighting group successful ✅",
    );

    const updatePlaceOfInstallationLightingDevicesResult =
      await this.updatePlaceOfInstallationLightingDevices(
        devices.map((device) => {
          return {
            id: device,
            state: LightingDeviceState.IN_STOCK,
            placeOfInstallation: "NOT_INSTALLED",
          };
        }),
      );

    if (isLeft(updatePlaceOfInstallationLightingDevicesResult)) {
      return left(new Error("UPDATE_FAILED"));
    }

    return right([lightingGroups[0], updatePlaceOfInstallationLightingDevicesResult.right]);
  }

  async moveLightingDevicesToGroup(
    locationFrom: string,
    locationTo: string,
    devices: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>> {
    const lightingGroupFrom = await this.removeLightingDevicesFromGroup(locationFrom, devices);
    const lightingGroupTo = await this.addLightingDevicesIntoGroup(locationTo, devices);

    if (isRight(lightingGroupFrom) && isRight(lightingGroupTo)) {
      this.logger.debug(
        { locationFrom, locationTo, devices },
        "Lighting devices was moved successful ✅",
      );

      return right(lightingGroupTo.right);
    }

    this.logger.error({ locationFrom, locationTo, devices }, "Lighting devices wasn't moved 🚨");

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

    const lightingGroups: LightingGroup[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        lightingGroups.push(new_val);
      }
    });

    if (lightingGroups.length === 0) {
      this.logger.error({ location, state, writeResult }, "Lighting group wasn't turned 🚨");

      return left(new Error("UPDATE_FAILED"));
    }

    this.logger.debug({ location, state, writeResult }, "Lighting group was turned successful ✅");

    const lightingGroup = lightingGroups[0];

    const updateStateLightingDevicesResult = await this.updateStateLightingDevices(
      lightingGroup.devices.map((deviceId) => {
        if (state === LightingGroupState.ON) {
          return { id: deviceId, state: LightingDeviceState.ON };
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

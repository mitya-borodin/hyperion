import { Either, left, right } from "fp-ts/Either";
import { Logger } from "pino";
import { Connection, r } from "rethinkdb-ts";

import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import {
  CreateLightingDevice,
  ILightingRepository,
  UpdateLightingDevices,
} from "../../../domain/lighting/lighting-repository";
import { LightingDeviceTable, lightingDeviceTable } from "../tables/lighting-device";

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
          ...device,
          id: r.uuid(),
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

    const result: LightingDeviceTable[] = [];

    writeResult.changes.forEach(({ new_val }) => {
      if (new_val) {
        result.push(new_val);
      }
    });

    this.logger.debug({ writeResult }, "Lighting devices was created successful");

    return right(result);
  }

  updateLightingDevices(
    devices: UpdateLightingDevices[],
  ): Promise<Either<Error, LightingDevice[]>> {
    throw new Error("Method not implemented.");
  }

  decommissioningLightingDevices(deviceIds: string[]): Promise<Either<Error, LightingDevice[]>> {
    throw new Error("Method not implemented.");
  }

  getLightningDevice(deviceId: string): Promise<Either<Error, LightingDevice>> {
    throw new Error("Method not implemented.");
  }

  initializeLightingGroup(locations: string[]): Promise<Either<Error, LightingGroup[]>> {
    throw new Error("Method not implemented.");
  }

  addLightingDeviceIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>> {
    throw new Error("Method not implemented.");
  }

  removeLightingDeviceFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>> {
    throw new Error("Method not implemented.");
  }

  moveLightingDeviceToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingGroup]>> {
    throw new Error("Method not implemented.");
  }
  turnOnGroup(location: string): Promise<Either<Error, LightingGroup>> {
    throw new Error("Method not implemented.");
  }

  turnOffGroup(location: string): Promise<Either<Error, LightingGroup>> {
    throw new Error("Method not implemented.");
  }

  getLightningGroup(groupId: string): Promise<Either<Error, LightingGroup>> {
    throw new Error("Method not implemented.");
  }
}

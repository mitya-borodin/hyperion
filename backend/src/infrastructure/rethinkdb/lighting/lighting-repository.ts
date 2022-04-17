import { Either } from "fp-ts/lib/Either";

import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import {
  CreateLightingDevice,
  ILightingRepository,
  UpdateLightingDevices,
} from "../../../domain/lighting/lighting-repository";

export class LightingRepository implements ILightingRepository {
  createLightingDevices(devices: CreateLightingDevice[]): Promise<Either<Error, LightingDevice[]>> {
    throw new Error("Method not implemented.");
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

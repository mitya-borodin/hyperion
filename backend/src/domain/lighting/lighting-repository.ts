import { Either } from "fp-ts/Either";

import { LightingDevice } from "./lighting-device";
import { LightingGroup } from "./lighting-group";

export type CreateLightingDevice = Omit<
  LightingDevice,
  "id" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export type UpdateLightingDevice = Omit<
  LightingDevice,
  "state" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export interface ILightingRepository {
  getLightningDevice(deviceId: string): Promise<Either<Error, LightingDevice | null>>;

  createLightingDevices(devices: CreateLightingDevice[]): Promise<Either<Error, LightingDevice[]>>;

  updateLightingDevice(devices: UpdateLightingDevice[]): Promise<Either<Error, LightingDevice[]>>;

  decommissioningLightingDevices(deviceIds: string[]): Promise<Either<Error, LightingDevice[]>>;

  getLightningGroup(groupId: string): Promise<Either<Error, LightingGroup | null>>;

  initializeLightingGroup(locations: string[]): Promise<Either<Error, LightingGroup[]>>;

  addLightingDeviceIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>>;

  removeLightingDeviceFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>>;

  moveLightingDeviceToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<Either<[Error, Error], [LightingGroup, LightingGroup]>>;

  turnOnGroup(location: string): Promise<Either<Error, LightingGroup>>;

  turnOffGroup(location: string): Promise<Either<Error, LightingGroup>>;
}

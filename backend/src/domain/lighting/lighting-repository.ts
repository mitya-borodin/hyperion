import { Either } from "fp-ts/Either";

import { LightingDevice } from "./lighting-device";
import { LightingGroup } from "./lighting-group";

export type CreateLightingDevice = Omit<
  LightingDevice,
  "id" | "placeOfInstallation" | "state" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export type UpdateProductDataLightingDevice = Omit<
  LightingDevice,
  "placeOfInstallation" | "state" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export type UpdatePlaceOfInstallationLightingDevice = Pick<
  LightingDevice,
  "id" | "state" | "placeOfInstallation"
>;

export type UpdateSateLightingDevice = Pick<LightingDevice, "id" | "state">;

export interface ILightingRepository {
  getLightingDevices(): Promise<Either<Error, LightingDevice[]>>;

  getLightingDevice(deviceId: string): Promise<Either<Error, LightingDevice | null>>;

  createLightingDevices(devices: CreateLightingDevice[]): Promise<Either<Error, LightingDevice[]>>;

  updateProductDataLightingDevices(
    devices: UpdateProductDataLightingDevice[],
  ): Promise<Either<Error, LightingDevice[]>>;

  decommissioningLightingDevices(deviceIds: string[]): Promise<Either<Error, LightingDevice[]>>;

  getLightingGroups(): Promise<Either<Error, LightingGroup[]>>;

  getLightingGroup(groupId: string): Promise<Either<Error, LightingGroup | null>>;

  createLightingGroups(locations: string[]): Promise<Either<Error, LightingGroup[]>>;

  addLightingDevicesIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>>;

  removeLightingDevicesFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>>;

  moveLightingDevicesToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingDevice[]]>>;

  turnOnGroup(location: string): Promise<Either<Error, [LightingGroup, LightingDevice[]]>>;

  turnOffGroup(location: string): Promise<Either<Error, [LightingGroup, LightingDevice[]]>>;
}

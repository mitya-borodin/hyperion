import { Either } from "fp-ts/lib/Either";

import { LightingDevice } from "./lighting-device";
import { LightingGroup } from "./lighting-group";

export type CreateLightingDevice = Omit<
  LightingDevice,
  "id" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export type UpdateLightingDevices = Omit<
  LightingDevice,
  "state" | "history" | "totalWorkedMs" | "createdAt" | "updatedAt"
>;

export interface ILightingRepository {
  createLightingDevices(devices: CreateLightingDevice[]): Promise<Either<Error, LightingDevice[]>>;

  updateLightingDevices(devices: UpdateLightingDevices[]): Promise<Either<Error, LightingDevice[]>>;

  decommissioningLightingDevices(deviceIds: string[]): Promise<Either<Error, LightingDevice[]>>;

  initializeLightingGroup(locations: string[]): Promise<Either<Error, LightingGroup[]>>;

  addLightingDeviceIntoGroup(
    lightingGroupLocation: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>>;

  removeLightingDeviceFromGroup(
    lightingGroupLocation: string,
    deviceIds: string[],
  ): Promise<Either<Error, LightingGroup>>;

  moveLightingDeviceToAnotherGroup(
    lightingGroupLocationFrom: string,
    lightingGroupLocationTo: string,
    deviceIds: string[],
  ): Promise<Either<Error, [LightingGroup, LightingGroup]>>;

  turnOnGroup(lightingGroupLocation: string): Promise<Either<Error, LightingGroup>>;

  turnOffGroup(lightingGroupLocation: string): Promise<Either<Error, LightingGroup>>;
}

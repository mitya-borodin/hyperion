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
  getLightingDevices(): Promise<LightingDevice[] | Error>;

  getLightingDevice(deviceId: string): Promise<LightingDevice | Error>;

  createLightingDevices(devices: CreateLightingDevice[]): Promise<LightingDevice[] | Error>;

  updateProductDataLightingDevices(
    devices: UpdateProductDataLightingDevice[],
  ): Promise<LightingDevice[] | Error>;

  decommissioningLightingDevices(deviceIds: string[]): Promise<LightingDevice[] | Error>;

  getLightingGroups(): Promise<LightingGroup[] | Error>;

  getLightingGroup(groupId: string): Promise<LightingGroup | Error>;

  createLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;

  addLightingDevicesIntoGroup(
    location: string,
    deviceIds: string[],
  ): Promise<[LightingGroup, LightingDevice[]] | Error>;

  removeLightingDevicesFromGroup(
    location: string,
    deviceIds: string[],
  ): Promise<[LightingGroup, LightingDevice[]] | Error>;

  moveLightingDevicesToGroup(
    locationFrom: string,
    locationTo: string,
    deviceIds: string[],
  ): Promise<[LightingGroup, LightingDevice[]] | Error>;

  turnOnGroup(location: string): Promise<[LightingGroup, LightingDevice[]] | Error>;

  turnOffGroup(location: string): Promise<[LightingGroup, LightingDevice[]] | Error>;
}

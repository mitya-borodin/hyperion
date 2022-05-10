import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { UpdateLightingDevice } from "../../../domain/lighting/lighting-repository";
import { UpdateLightingDevicesBodySchema } from "../types/lighting/update-lighting-device.body";
import { UpdateLightingDevicesReplySchema } from "../types/lighting/update-lighting-device.reply";

export const mapUpdateLightingDevicesToApp = (
  devices: UpdateLightingDevicesBodySchema,
): UpdateLightingDevice[] => {
  return devices;
};

export const mapUpdateLightingDevicesToHttp = (
  devices: LightingDevice[],
): UpdateLightingDevicesReplySchema => {
  return devices;
};

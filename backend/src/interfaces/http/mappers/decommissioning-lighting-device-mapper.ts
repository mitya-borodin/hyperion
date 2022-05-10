import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { DecommissioningLightingDeviceReplySchema } from "../types/lighting/decommissioning-lighting-device.reply";

export const mapDecommissioningLightingDeviceToHttp = (
  devices: LightingDevice[],
): DecommissioningLightingDeviceReplySchema => {
  return devices;
};

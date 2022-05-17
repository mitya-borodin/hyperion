import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { DecommissioningLightingDeviceReplySchema } from "../types/lighting/decommissioning-lighting-devices.reply";

export const mapDecommissioningLightingDevicesToHttp = (
  devices: LightingDevice[],
): DecommissioningLightingDeviceReplySchema => {
  return devices;
};

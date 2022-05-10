import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { DecommissioningLightningDeviceReplySchema } from "../types/lighting/decommissioning-lightning-device.reply";

export const mapDecommissioningLightningDeviceToHttp = (
  devices: LightingDevice[],
): DecommissioningLightningDeviceReplySchema => {
  return devices;
};

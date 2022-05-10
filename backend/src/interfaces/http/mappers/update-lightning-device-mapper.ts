import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { UpdateLightingDevice } from "../../../domain/lighting/lighting-repository";
import { UpdateLightningDevicesBodySchema } from "../types/lighting/update-lightning-device.body";
import { UpdateLightningDevicesReplySchema } from "../types/lighting/update-lightning-device.reply";

export const mapUpdateLightningDevicesToApp = (
  devices: UpdateLightningDevicesBodySchema,
): UpdateLightingDevice[] => {
  return devices;
};

export const mapUpdateLightningDevicesToHttp = (
  devices: LightingDevice[],
): UpdateLightningDevicesReplySchema => {
  return devices;
};

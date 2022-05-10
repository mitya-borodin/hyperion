import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { GetLightningDeviceReplySchema } from "../types/lighting/get-lightning-device.reply";

export const mapGetLightningDeviceToHttp = (
  lightningDevice: LightingDevice,
): GetLightningDeviceReplySchema => {
  return lightningDevice;
};

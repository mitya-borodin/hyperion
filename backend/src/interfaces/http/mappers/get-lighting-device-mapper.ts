import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { GetLightingDeviceReplySchema } from "../types/lighting/get-lighting-device.reply";

export const mapGetLightingDeviceToHttp = (
  lightingDevice: LightingDevice,
): GetLightingDeviceReplySchema => {
  return lightingDevice;
};

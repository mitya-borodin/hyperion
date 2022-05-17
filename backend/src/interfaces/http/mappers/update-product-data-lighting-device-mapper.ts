import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { UpdateProductDataLightingDevice } from "../../../domain/lighting/lighting-repository";
import { UpdateProductDataLightingDevicesBodySchema } from "../types/lighting/update-product-data-lighting-devices.body";
import { UpdateProductDataLightingDevicesReplySchema } from "../types/lighting/update-product-data-lighting-devices.reply";

export const mapUpdateProductDataLightingDevicesToApp = (
  devices: UpdateProductDataLightingDevicesBodySchema,
): UpdateProductDataLightingDevice[] => {
  return devices;
};

export const mapUpdateProductDataLightingDevicesToHttp = (
  devices: LightingDevice[],
): UpdateProductDataLightingDevicesReplySchema => {
  return devices;
};

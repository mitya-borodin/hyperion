import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { CreateLightingDevice } from "../../../domain/lighting/lighting-repository";
import { CreateLightingDevicesBodySchema } from "../types/lighting/create-lighting-devices.body";
import { CreateLightingDevicesReplySchema } from "../types/lighting/create-lighting-devices.reply";

export const mapCreateLightingDevicesToApp = (
  devices: CreateLightingDevicesBodySchema,
): CreateLightingDevice[] => {
  return devices.map((device) => {
    return {
      name: device.name,
      brand: device.brand,
      power: device.power,
      lumens: device.lumens,
      lightTemperatureKelvin: device.lightTemperatureKelvin,
      resourceMs: device.resourceMs,
      price: device.price,
      currency: device.currency,
      sellersWebsite: device.sellersWebsite,
      images: device.images,
    };
  });
};

export const mapCreateLightingDevicesToHttp = (
  devices: LightingDevice[],
): CreateLightingDevicesReplySchema => {
  return devices;
};

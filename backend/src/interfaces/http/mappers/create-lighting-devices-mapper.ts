import { LightingDevice, LightingDeviceState } from "../../../domain/lighting/lighting-device";
import { CreateLightingDevice } from "../../../domain/lighting/lighting-repository";
import { CreateLightingDeviceBodySchema } from "../types/lighting/create-lighting-device.body";
import { CreateLightingDeviceReplySchema } from "../types/lighting/create-lighting-device.reply";

export const mapCreateLightingDevicesToApp = (
  devices: CreateLightingDeviceBodySchema,
): CreateLightingDevice[] => {
  return devices.map((device) => {
    let state: LightingDeviceState = LightingDeviceState.OFF;

    if (device.state === "ON") {
      state = LightingDeviceState.ON;
    }

    if (device.state === "OFF") {
      state = LightingDeviceState.OFF;
    }

    if (device.state === "IN_STOCK") {
      state = LightingDeviceState.IN_STOCK;
    }

    if (device.state === "DECOMMISSIONED") {
      state = LightingDeviceState.DECOMMISSIONED;
    }

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
      placeOfInstallation: device.placeOfInstallation,
      state,
    };
  });
};

export const mapCreateLightingDevicesToHttp = (
  devices: LightingDevice[],
): CreateLightingDeviceReplySchema => {
  return devices;
};

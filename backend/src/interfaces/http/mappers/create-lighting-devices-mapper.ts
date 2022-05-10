import { LightingDevice, LightingDeviceState } from "../../../domain/lighting/lighting-device";
import { CreateLightingDevice } from "../../../domain/lighting/lighting-repository";
import { CreateLightningDeviceBodySchema } from "../types/lighting/create-lightning-device.body";
import { CreateLightningDeviceReplySchema } from "../types/lighting/create-lightning-device.reply";

export const mapCreateLightningDevicesToApp = (
  devices: CreateLightningDeviceBodySchema,
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

export const mapCreateLightningDevicesToHttp = (
  devices: LightingDevice[],
): CreateLightningDeviceReplySchema => {
  return devices;
};

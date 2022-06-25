import { LightingDevice } from "../../domain/lighting/lighting-device";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Output = LightingDevice[] | Error;

export const getGetLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<void, Promise<Output>> => {
  return async (): Promise<Output> => {
    return lightingRepository.getLightingDevices();
  };
};

import { LightingDevice } from "../../domain/lighting/lighting-device";
import {
  CreateLightingDevice,
  ILightingRepository,
} from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  devices: CreateLightingDevice[];
};

type Output = LightingDevice[] | Error;

export const getCreateLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.createLightingDevices(params.devices);
  };
};

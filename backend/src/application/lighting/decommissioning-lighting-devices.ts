import { LightingDevice } from "../../domain/lighting/lighting-device";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  deviceIds: string[];
};

type Output = LightingDevice[] | Error;

export const getDecommissioningLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.decommissioningLightingDevices(params.deviceIds);
  };
};

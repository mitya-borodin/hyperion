import { LightingDevice } from "../../domain/lighting/lighting-device";
import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocationFrom: string;
  lightingGroupLocationTo: string;
  deviceIds: string[];
};

type Output = [LightingGroup, LightingDevice[]] | Error;

export const getMoveLightingDevicesToAnotherGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.moveLightingDevicesToGroup(
      params.lightingGroupLocationFrom,
      params.lightingGroupLocationTo,
      params.deviceIds,
    );
  };
};

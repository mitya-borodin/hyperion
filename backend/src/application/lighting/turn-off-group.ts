import { LightingDevice } from "../../domain/lighting/lighting-device";
import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocation: string;
};

type Output = [LightingGroup, LightingDevice[]] | Error;

export const getTurnOffGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.turnOffGroup(params.lightingGroupLocation);
  };
};

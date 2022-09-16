import { LightingGroup, LightingGroupState } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocations: string[];
  lightingGroupState: LightingGroupState;
};

type Output = LightingGroup[] | Error;

export const getTurnGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.turnGroups(params.lightingGroupLocations, params.lightingGroupState);
  };
};

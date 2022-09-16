import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocations: string[];
};

type Output = LightingGroup[] | Error;

export const getCreateLightingGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.createLightingGroups(params.lightingGroupLocations);
  };
};

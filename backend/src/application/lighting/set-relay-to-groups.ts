import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import { COMMON_RELAY_NAME } from "../../domain/wirenboard/relays";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocations: string;
  relays: COMMON_RELAY_NAME[];
};

type Output = LightingGroup[] | Error;

export const removeLightingGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.setRelayToGroup(params.lightingGroupLocations, params.relays);
  };
};

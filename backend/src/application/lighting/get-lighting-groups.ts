import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Output = LightingGroup[] | Error;

export const getGetLightingGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<void, Promise<Output>> => {
  return async (): Promise<Output> => {
    return lightingRepository.getLightingGroups();
  };
};

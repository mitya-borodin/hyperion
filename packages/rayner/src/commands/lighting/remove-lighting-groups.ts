import { LightingGroup } from '../../domain/lighting/lighting-group';
import { ILightingRepository } from '../../ports/lighting-repository';
import type { Command } from '../Command';

type Parameters = {
  lightingGroupLocations: string[];
};

type Output = LightingGroup[] | Error;

export const removeLightingGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<Parameters, Promise<Output>> => {
  return async (parameters: Parameters): Promise<Output> => {
    return lightingRepository.removeLightingGroups(parameters.lightingGroupLocations);
  };
};

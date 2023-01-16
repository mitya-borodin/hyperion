import { LightingGroup, LightingGroupState } from '../../domain/lighting/lighting-group';
import { ILightingRepository } from '../../ports/lighting-repository';
import type { Command } from '../Command';

type Parameters = {
  lightingGroupLocations: string[];
  lightingGroupState: LightingGroupState;
};

type Output = LightingGroup[] | Error;

export const getTurnGroupsCommand = (lightingRepository: ILightingRepository): Command<Parameters, Promise<Output>> => {
  return async (parameters: Parameters): Promise<Output> => {
    return lightingRepository.turnGroups(parameters.lightingGroupLocations, parameters.lightingGroupState);
  };
};

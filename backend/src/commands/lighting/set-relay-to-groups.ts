import { LightingGroup } from '../../domain/lighting/lighting-group';
import { COMMON_RELAY_NAME } from '../../domain/wirenboard/relays';
import { ILightingRepository } from '../../ports/lighting-repository';
import type { Command } from '../Command';

type Parameters = {
  lightingGroupLocations: string;
  relays: COMMON_RELAY_NAME[];
};

type Output = LightingGroup[] | Error;

export const removeLightingGroupsCommand = (
  lightingRepository: ILightingRepository,
): Command<Parameters, Promise<Output>> => {
  return async (parameters: Parameters): Promise<Output> => {
    return lightingRepository.setRelayToGroup(parameters.lightingGroupLocations, parameters.relays);
  };
};

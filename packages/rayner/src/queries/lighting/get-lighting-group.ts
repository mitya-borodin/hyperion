import { LightingGroup } from '../../domain/lighting/lighting-group';
import { ILightingRepository } from '../../ports/lighting-repository';
import type { Query } from '../Query';

type Parameters = {
  groupId: string;
};

type Output = LightingGroup | Error;

export const getGetLightingGroupQuery = (
  lightingRepository: ILightingRepository,
): Query<Parameters, Promise<Output>> => {
  return async (parameters: Parameters): Promise<Output> => {
    return lightingRepository.getLightingGroup(parameters.groupId);
  };
};

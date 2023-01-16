import { LightingGroup } from '../../domain/lighting/lighting-group';
import { ILightingRepository } from '../../ports/lighting-repository';
import { Query } from '../Query';

type Output = LightingGroup[] | Error;

export const getGetLightingGroupsQuery = (lightingRepository: ILightingRepository): Query<void, Promise<Output>> => {
  return async (): Promise<Output> => {
    return lightingRepository.getLightingGroups();
  };
};

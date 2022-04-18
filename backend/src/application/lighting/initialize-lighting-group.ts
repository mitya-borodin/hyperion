import { Either } from "fp-ts/Either";

import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocations: string[];
};

type Output = Either<Error, LightingGroup[]>;

export const getInitializeLightingGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.initializeLightingGroup(params.lightingGroupLocations);
  };
};

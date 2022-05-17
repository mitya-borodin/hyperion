import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocation: string;
};

type Output = Either<Error, [LightingGroup, LightingDevice[]]>;

export const getTurnOnGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.turnOnGroup(params.lightingGroupLocation);
  };
};

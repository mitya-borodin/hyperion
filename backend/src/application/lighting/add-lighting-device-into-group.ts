import { Either } from "fp-ts/Either";

import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocation: string;
  deviceIds: string[];
};

type Output = Either<Error, LightingGroup>;

export const getAddLightingDeviceIntoGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.addLightingDeviceIntoGroup(
      params.lightingGroupLocation,
      params.deviceIds,
    );
  };
};

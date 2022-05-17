import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocation: string;
  deviceIds: string[];
};

type Output = Either<Error, [LightingGroup, LightingDevice[]]>;

export const getAddLightingDevicesIntoGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.addLightingDevicesIntoGroup(
      params.lightingGroupLocation,
      params.deviceIds,
    );
  };
};

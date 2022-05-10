import { Either } from "fp-ts/Either";

import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  lightingGroupLocationFrom: string;
  lightingGroupLocationTo: string;
  deviceIds: string[];
};

type Output = Either<[Error, Error], [LightingGroup, LightingGroup]>;

export const getMoveLightingDeviceToAnotherGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.moveLightingDeviceToGroup(
      params.lightingGroupLocationFrom,
      params.lightingGroupLocationTo,
      params.deviceIds,
    );
  };
};

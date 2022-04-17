import { Either } from "fp-ts/lib/Either";

import { LightingGroup } from "../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  groupId: string;
};

type Output = Either<Error, LightingGroup>;

export const getGetLightningGroupCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.getLightningGroup(params.groupId);
  };
};

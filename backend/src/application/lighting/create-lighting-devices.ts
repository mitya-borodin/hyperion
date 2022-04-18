import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import {
  CreateLightingDevice,
  ILightingRepository,
} from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  device: CreateLightingDevice[];
};

type Output = Either<Error, LightingDevice[]>;

export const getCreateLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.createLightingDevices(params.device);
  };
};

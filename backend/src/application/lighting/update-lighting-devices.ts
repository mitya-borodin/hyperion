import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import {
  ILightingRepository,
  UpdateLightingDevice,
} from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  devices: UpdateLightingDevice[];
};

type Output = Either<Error, LightingDevice[]>;

export const getUpdateLightingDeviceCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.updateLightingDevice(params.devices);
  };
};

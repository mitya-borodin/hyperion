import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Output = Either<Error, LightingDevice[]>;

export const getGetLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<void, Promise<Output>> => {
  return async (): Promise<Output> => {
    return lightingRepository.getLightingDevices();
  };
};

import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import { ILightingRepository } from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  deviceId: string;
};

type Output = Either<Error, LightingDevice | null>;

export const getGetLightingDeviceCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.getLightingDevice(params.deviceId);
  };
};

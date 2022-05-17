import { Either } from "fp-ts/Either";

import { LightingDevice } from "../../domain/lighting/lighting-device";
import {
  ILightingRepository,
  UpdateProductDataLightingDevice,
} from "../../domain/lighting/lighting-repository";
import type { Command } from "../Command";

type Params = {
  devices: UpdateProductDataLightingDevice[];
};

type Output = Either<Error, LightingDevice[]>;

export const getUpdateProductDataLightingDevicesCommand = (
  lightingRepository: ILightingRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return lightingRepository.updateProductDataLightingDevices(params.devices);
  };
};

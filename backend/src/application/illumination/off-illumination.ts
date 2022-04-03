import type { IIlluminationRepository, Illumination } from "../../domain/illumination";
import type { Command } from "../Command";

type Params = {
  id: string;
};

type Output = Illumination;

export const offIlluminationCommand = (
  illuminationRepository: IIlluminationRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return illuminationRepository.off(params.id);
  };
};

import type { IUserRepository, Token } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  refreshToken: string;
};

type Output = boolean;

export const createHasRefreshSessionCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.hasRefreshSession(params.refreshToken);
  };
};

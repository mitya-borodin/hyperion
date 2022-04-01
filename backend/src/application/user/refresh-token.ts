import type { IUserRepository, Token } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  refreshToken: string;
  fingerprint: string;
};

type Output = Token | null;

export const createRefreshTokenCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.refreshToken(params.refreshToken, params.fingerprint);
  };
};

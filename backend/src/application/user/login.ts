import type { IUserRepository, Token } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  email: string;
  password: string;
  fingerprint: string;
};

type Output = Token | null;

export const createLoginCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.login(params.email, params.password, params.fingerprint);
  };
};

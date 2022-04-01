import type { IUserRepository } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  email: string;
  password: string;
  confirmPassword: string;
  fingerprint: string;
};

type Output = boolean;

export const createCreateUserCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.createUser(
      params.email,
      params.password,
      params.confirmPassword,
      params.fingerprint,
    );
  };
};

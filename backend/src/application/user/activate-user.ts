import type { IUserRepository } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  confirmEmailIdent: string;
};

type Output = boolean;

export const createActivateUserCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.activateUser(params.confirmEmailIdent);
  };
};

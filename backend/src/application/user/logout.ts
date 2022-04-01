import type { IUserRepository } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  userId: number;
  refreshSessionId: string;
};

type Output = void;

export const createLogoutCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.logout(params.userId, params.refreshSessionId);
  };
};

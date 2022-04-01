import type { IUserRepository, User } from "../../domain/user";
import type { Command } from "../command";

type Params = {
  userId: number;
};

type Output = User | null;

export const createGetUserByIdCommand = (
  userRepository: IUserRepository,
): Command<Params, Promise<Output>> => {
  return async (params: Params): Promise<Output> => {
    return userRepository.getUserById(params.userId);
  };
};

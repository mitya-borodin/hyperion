import { Logger } from 'pino';

import { UserStatus } from '../../domain/user';
import { ErrorType } from '../../helpers/error-type';
import { IUserRepository } from '../../ports/user-repository';

export type DeleteUser = {
  logger: Logger;
  userRepository: IUserRepository;
  userId: string;
};

export const deleteUser = async ({ logger, userRepository, userId }: DeleteUser): Promise<void | Error> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.status === UserStatus.DELETED) {
    logger.error({ userId }, 'This user is already deleted 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.delete(userId);

  if (user instanceof Error) {
    return user;
  }
};

import debug from 'debug';

import { UserStatus } from '../../domain/user';
import { ErrorType } from '../../helpers/error-type';
import { IUserRepository } from '../../ports/user-repository';

const logger = debug('delete-user');

export type DeleteUser = {
  userRepository: IUserRepository;
  userId: string;
};

export const deleteUser = async ({ userRepository, userId }: DeleteUser): Promise<void | Error> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.status === UserStatus.DELETED) {
    logger('This user is already deleted 🚨');
    logger(JSON.stringify({ userId }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.delete(userId);

  if (user instanceof Error) {
    return user;
  }
};

import { Logger } from 'pino';

import { UserRole } from '../../domain/user';
import { createPasswordHash } from '../../helpers/create-password-hash';
import { ErrorExplanation } from '../../helpers/custom-error';
import { ErrorCode, ErrorMessage } from '../../helpers/error-type';
import { Config } from '../../infrastructure/config';
import { IUserRepository, UserOutput } from '../../ports/user-repository';

export type CreateUser = {
  logger: Logger;
  config: Config;
  userRepository: IUserRepository;
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

export const createUser = async ({
  logger,
  config,
  userRepository,
  email,
  name,
  role,
  password,
}: CreateUser): Promise<Error | { user?: UserOutput; error: ErrorExplanation }> => {
  let user = await userRepository.getByEmail(email);

  if (user instanceof Error) {
    return user;
  }

  if (user) {
    logger.error({ user }, 'The user already exist 🚨');

    return {
      user: undefined,
      error: {
        code: ErrorCode.USER_EXISTS,
        message: ErrorMessage.USER_EXISTS,
      },
    };
  }

  const { passwordHash, salt } = createPasswordHash({ config, password });

  user = await userRepository.create({
    name,
    email,
    role,
    hash: passwordHash,
    salt,
  });

  if (user instanceof Error) {
    return user;
  }

  return {
    user,
    error: {
      code: ErrorCode.ALL_RIGHT,
      message: ErrorMessage.ALL_RIGHT,
    },
  };
};

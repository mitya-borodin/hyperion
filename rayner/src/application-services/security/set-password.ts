import { createPasswordHash } from '../../helpers/create-password-hash';
import { Config } from '../../infrastructure/config';
import { IUserRepository } from '../../ports/user-repository';

export type SetPassword = {
  config: Config;
  userRepository: IUserRepository;
  userId: string;
  password: string;
};

export const setPassword = async ({ config, userRepository, userId, password }: SetPassword): Promise<void | Error> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  const { passwordHash, salt } = createPasswordHash({ config, password });

  user = await userRepository.update({
    id: user.id,
    hash: passwordHash,
    salt,
  });

  if (user instanceof Error) {
    return user;
  }
};

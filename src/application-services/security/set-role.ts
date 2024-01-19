import { UserRole } from '../../domain/user';
import { IUserRepository } from '../../ports/user-repository';

export type SetRole = {
  userRepository: IUserRepository;
  userId: string;
  role: UserRole;
};

export const setRole = async ({ userRepository, userId, role }: SetRole): Promise<void | Error> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  user = await userRepository.update({
    id: user.id,
    role,
  });

  if (user instanceof Error) {
    return user;
  }
};

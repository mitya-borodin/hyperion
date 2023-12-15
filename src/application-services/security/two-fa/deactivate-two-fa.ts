import debug from 'debug';

import { ErrorType } from '../../../helpers/error-type';
import { verifyTwoFa } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IUserRepository } from '../../../ports/user-repository';

const logger = debug('deactivate-two-fa');

export type DeactivateTwoFa = {
  userRepository: IUserRepository;
  userId: string;
  totp: string;
};

export const deactivateTwoFa = async ({ userRepository, userId, totp }: DeactivateTwoFa): Promise<Error | void> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (!user.isTwoFaActivated) {
    logger('The user has not activated TwoFa before 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user.twoFaSecret) {
    logger('The user does not contain the secret of Two Fa 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const isTotpValid = verifyTwoFa({
    secret: user.twoFaSecret,
    totp,
  });

  if (isTotpValid instanceof Error) {
    return isTotpValid;
  }

  if (!isTotpValid) {
    logger('User provided wrong OTP 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.update({
    id: user.id,
    twoFaSecret: '',
    isTwoFaActivated: false,
  });

  if (user instanceof Error) {
    return user;
  }
};

import debug from 'debug';

import { ErrorType } from '../../../helpers/error-type';
import { verifyTwoFa } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IUserRepository } from '../../../ports/user-repository';

const logger = debug('confirm-two-fa');

export type ConfirmTwoFa = {
  userRepository: IUserRepository;
  userId: string;
  totp: string;
};

export const confirmTwoFa = async ({ userRepository, userId, totp }: ConfirmTwoFa): Promise<Error | void> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.isTwoFaActivated) {
    logger('TwoFa has already been confirmed 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user.twoFaSecret) {
    logger('The user does not contain a secret to confirm Two Fa 🚨');

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

  user = await userRepository.update({ id: userId, isTwoFaActivated: true });

  if (user instanceof Error) {
    return user;
  }
};

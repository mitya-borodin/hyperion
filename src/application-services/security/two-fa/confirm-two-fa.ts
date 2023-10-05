import { Logger } from 'pino';

import { ErrorType } from '../../../helpers/error-type';
import { verifyTwoFa } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IUserRepository } from '../../../ports/user-repository';

export type ConfirmTwoFa = {
  logger: Logger;
  userRepository: IUserRepository;
  userId: string;
  totp: string;
};

export const confirmTwoFa = async ({ logger, userRepository, userId, totp }: ConfirmTwoFa): Promise<Error | void> => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.isTwoFaActivated) {
    logger.error('TwoFa has already been confirmed 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user.twoFaSecret) {
    logger.error('The user does not contain a secret to confirm Two Fa 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const isTotpValid = verifyTwoFa({
    logger,
    secret: user.twoFaSecret,
    totp,
  });

  if (isTotpValid instanceof Error) {
    return isTotpValid;
  }

  if (!isTotpValid) {
    logger.error('User provided wrong OTP 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.update({ id: userId, isTwoFaActivated: true });

  if (user instanceof Error) {
    return user;
  }
};

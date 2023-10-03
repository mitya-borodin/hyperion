import { Logger } from 'pino';
import { toDataURL } from 'qrcode';

import { ErrorType } from '../../../helpers/error-type';
import { createTwoFa } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IUserRepository } from '../../../ports/user-repository';

export type ActivateTwoFa = {
  logger: Logger;
  userRepository: IUserRepository;
  userId: string;
};

export const activateTwoFa = async ({ userRepository, logger, userId }: ActivateTwoFa) => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.isTwoFaActivated) {
    logger.error({ userId }, 'Two Fa was already activated 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const twoFa = createTwoFa({ logger });

  if (twoFa instanceof Error) {
    return twoFa;
  }

  if (!twoFa.otpauth_url) {
    logger.error({ userId, twoFa }, 'The otpauth_url field is missing, TwoFa could not be created. 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.update({ id: user.id, twoFaSecret: twoFa.hex });

  if (user instanceof Error) {
    return user;
  }

  const qr = await toDataURL(twoFa.otpauth_url);

  return { qr, code: twoFa.base32 };
};

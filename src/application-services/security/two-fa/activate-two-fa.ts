import debug from 'debug';
import { toDataURL } from 'qrcode';

import { ErrorType } from '../../../helpers/error-type';
import { createTwoFa } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IUserRepository } from '../../../ports/user-repository';

const logger = debug('activate-two-fa');

export type ActivateTwoFa = {
  userRepository: IUserRepository;
  userId: string;
};

export const activateTwoFa = async ({ userRepository, userId }: ActivateTwoFa) => {
  let user = await userRepository.get(userId);

  if (user instanceof Error) {
    return user;
  }

  if (user.isTwoFaActivated) {
    logger('Two Fa was already activated 🚨');
    logger(JSON.stringify({ userId }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const twoFa = createTwoFa();

  if (twoFa instanceof Error) {
    return twoFa;
  }

  if (!twoFa.otpauth_url) {
    logger('The otpauth_url field is missing, TwoFa could not be created 🚨');
    logger(JSON.stringify({ userId, twoFa }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  user = await userRepository.update({ id: user.id, twoFaSecret: twoFa.hex });

  if (user instanceof Error) {
    return user;
  }

  const qr = await toDataURL(twoFa.otpauth_url);

  return { qr, code: twoFa.base32 };
};

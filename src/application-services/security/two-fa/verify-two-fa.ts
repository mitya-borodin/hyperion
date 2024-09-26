import debug from 'debug';

import { RefreshSession } from '../../../domain/refresh-session';
import { ErrorType } from '../../../helpers/error-type';
import { verifyTwoFa as verifyTwoFaAdapter } from '../../../infrastructure/external-resource-adapters/two-fa';
import { RefreshSessionPort } from '../../../ports/refresh-session-port';
import { UserPort, UserOutput } from '../../../ports/user-port';
import { createRefreshSession } from '../create-refresh-session';

const logger = debug('hyperion-verify-two-fa');

export type VerifyTwoFa = {
  userRepository: UserPort;
  refreshSessionRepository: RefreshSessionPort;
  fingerprint: string;
  email: string;
  totp: string;
};

export const verifyTwoFa = async ({
  userRepository,
  refreshSessionRepository,

  fingerprint,
  email,
  totp,
}: VerifyTwoFa): Promise<Error | { user: UserOutput; refreshSession: RefreshSession }> => {
  const user = await userRepository.getByEmail(email);

  if (user instanceof Error) {
    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user) {
    logger('The user was not found by email 🚨');
    logger(JSON.stringify({ fingerprint, email, totp }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const { id, twoFaSecret } = user;

  if (!twoFaSecret) {
    logger('Two Fa was not activated 🚨');
    logger(JSON.stringify({ user }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const isTotpValid = verifyTwoFaAdapter({
    secret: twoFaSecret,
    totp,
  });

  if (isTotpValid instanceof Error) {
    return isTotpValid;
  }

  if (!isTotpValid) {
    logger('TOTP failed verification 🚨');
    logger(JSON.stringify({ fingerprint, totp, user }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const refreshSession = await createRefreshSession({
    refreshSessionRepository,
    fingerprint,
    userId: id,
  });

  if (refreshSession instanceof Error) {
    return refreshSession;
  }

  return { user, refreshSession };
};

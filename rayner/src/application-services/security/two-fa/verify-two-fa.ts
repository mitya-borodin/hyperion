import { Logger } from 'pino';

import { RefreshSession } from '../../../domain/refresh-session';
import { ErrorType } from '../../../helpers/error-type';
import { verifyTwoFa as verifyTwoFaAdapter } from '../../../infrastructure/external-resource-adapters/two-fa';
import { IRefreshSessionRepository } from '../../../ports/refresh-session-repository';
import { IUserRepository, UserOutput } from '../../../ports/user-repository';
import { createRefreshSession } from '../create-refresh-session';

export type VerifyTwoFa = {
  logger: Logger;
  userRepository: IUserRepository;
  refreshSessionRepository: IRefreshSessionRepository;
  fingerprint: string;
  email: string;
  totp: string;
};

export const verifyTwoFa = async ({
  userRepository,
  refreshSessionRepository,
  logger,
  fingerprint,
  email,
  totp,
}: VerifyTwoFa): Promise<Error | { user: UserOutput; refreshSession: RefreshSession }> => {
  const user = await userRepository.getByEmail(email);

  if (user instanceof Error) {
    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user) {
    logger.error({ fingerprint, email, totp }, 'The user was not found by email 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const { id, twoFaSecret } = user;

  if (!twoFaSecret) {
    logger.error({ user }, 'Two Fa was not activated 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const isTotpValid = verifyTwoFaAdapter({
    logger,
    secret: twoFaSecret,
    totp,
  });

  if (isTotpValid instanceof Error) {
    return isTotpValid;
  }

  if (!isTotpValid) {
    logger.error({ fingerprint, totp, user }, 'TOTP failed verification 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const refreshSession = await createRefreshSession({
    logger,
    refreshSessionRepository,
    fingerprint,
    userId: id,
  });

  if (refreshSession instanceof Error) {
    return refreshSession;
  }

  return { user, refreshSession };
};

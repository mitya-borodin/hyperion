import { Logger } from 'pino';

import { RefreshSession } from '../../domain/refresh-session';
import { CodeType, createCode } from '../../helpers/create-code';
import { ErrorType } from '../../helpers/error-type';
import { IRefreshSessionRepository } from '../../ports/refresh-session-repository';
import { UserOutput } from '../../ports/user-repository';

export type RefreshAccessToken = {
  logger: Logger;
  refreshSessionRepository: IRefreshSessionRepository;
  fingerprint: string;
  refreshToken: string;
};

export const refreshAccessToken = async ({
  logger,
  refreshSessionRepository,
  fingerprint,
  refreshToken,
}: RefreshAccessToken): Promise<Error | { user: UserOutput; refreshSession: RefreshSession }> => {
  const refreshSession = await refreshSessionRepository.getByRefreshToken(refreshToken);

  if (refreshSession instanceof Error) {
    return refreshSession;
  }

  if (new Date() > refreshSession.expiresIn) {
    logger.error('Failed to update a refresh session, because session expired 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const code = createCode(CodeType.REFRESH_TOKEN, logger);

  if (code instanceof Error) {
    return code;
  }

  const nextRefreshSession = await refreshSessionRepository.create({
    refreshToken: code.value,
    expiresIn: code.expiresIn,
    fingerprint,
    userId: refreshSession.userId,
  });

  await refreshSessionRepository.removeByRefreshToken(refreshToken);

  if (nextRefreshSession instanceof Error) {
    return nextRefreshSession;
  }

  return { refreshSession: nextRefreshSession, user: nextRefreshSession.user };
};

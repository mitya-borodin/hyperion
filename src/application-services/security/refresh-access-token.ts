import debug from 'debug';

import { RefreshSession } from '../../domain/refresh-session';
import { CodeType, createCode } from '../../helpers/create-code';
import { ErrorType } from '../../helpers/error-type';
import { RefreshSessionPort } from '../../ports/refresh-session-port';
import { UserOutput } from '../../ports/user-port';

const logger = debug('hyperion-refresh-access-token');

export type RefreshAccessToken = {
  refreshSessionRepository: RefreshSessionPort;
  fingerprint: string;
  refreshToken: string;
};

export const refreshAccessToken = async ({
  refreshSessionRepository,
  fingerprint,
  refreshToken,
}: RefreshAccessToken): Promise<Error | { user: UserOutput; refreshSession: RefreshSession }> => {
  const refreshSession = await refreshSessionRepository.getByRefreshToken(refreshToken);

  if (refreshSession instanceof Error) {
    return refreshSession;
  }

  if (new Date() > refreshSession.expiresIn) {
    logger('Failed to update a refresh session, because session expired 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const code = createCode(CodeType.REFRESH_TOKEN);

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

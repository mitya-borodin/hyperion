import debug from 'debug';

import { ErrorType } from '../../helpers/error-type';
import { RefreshSessionPort } from '../../ports/refresh-session-port';

const logger = debug('hyperion-sign-out');

export type SignOut = {
  refreshSessionRepository: RefreshSessionPort;
  refreshToken: string;
};

export const signOut = async ({ refreshSessionRepository, refreshToken }: SignOut): Promise<Error | void> => {
  const refreshSession = await refreshSessionRepository.removeByRefreshToken(refreshToken);

  if (refreshSession instanceof Error) {
    logger('Failed to remove a refresh session 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }
};

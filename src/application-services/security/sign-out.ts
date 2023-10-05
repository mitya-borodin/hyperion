import { Logger } from 'pino';

import { ErrorType } from '../../helpers/error-type';
import { IRefreshSessionRepository } from '../../ports/refresh-session-repository';

export type SignOut = {
  logger: Logger;
  refreshSessionRepository: IRefreshSessionRepository;
  refreshToken: string;
};

export const signOut = async ({ refreshSessionRepository, logger, refreshToken }: SignOut): Promise<Error | void> => {
  const refreshSession = await refreshSessionRepository.removeByRefreshToken(refreshToken);

  if (refreshSession instanceof Error) {
    logger.error('Failed to remove a refresh session 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }
};

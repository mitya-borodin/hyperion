import { Logger } from 'pino';

import { RefreshSession } from '../../domain/refresh-session';
import { CodeType, createCode } from '../../helpers/create-code';
import { IRefreshSessionRepository } from '../../ports/refresh-session-repository';
import { UserOutput } from '../../ports/user-repository';

type CreateRefreshSessionParameters = {
  logger: Logger;
  refreshSessionRepository: IRefreshSessionRepository;
  fingerprint: string;
  userId: string;
};

export const createRefreshSession = async ({
  logger,
  refreshSessionRepository,
  fingerprint,
  userId,
}: CreateRefreshSessionParameters): Promise<Error | (RefreshSession & { user: UserOutput })> => {
  const refreshSessions = await refreshSessionRepository.getAllByUserId(userId);

  if (refreshSessions instanceof Error) {
    return refreshSessions;
  }

  if (refreshSessions.length >= 5) {
    logger.warn({ userId }, 'The user has more than 5 simultaneous sessions 🚨');

    await refreshSessionRepository.removeAllByUserId(userId);
  }

  const code = createCode(CodeType.REFRESH_TOKEN, logger);

  if (code instanceof Error) {
    return code;
  }

  return refreshSessionRepository.create({
    fingerprint,
    userId,
    refreshToken: code.value,
    expiresIn: code.expiresIn,
  });
};

import debug from 'debug';

import { RefreshSession } from '../../domain/refresh-session';
import { CodeType, createCode } from '../../helpers/create-code';
import { IRefreshSessionRepository } from '../../ports/refresh-session-repository';
import { UserOutput } from '../../ports/user-repository';

const logger = debug('hyperion-create-refresh-session');

type CreateRefreshSessionParameters = {
  refreshSessionRepository: IRefreshSessionRepository;
  fingerprint: string;
  userId: string;
};

export const createRefreshSession = async ({
  refreshSessionRepository,
  fingerprint,
  userId,
}: CreateRefreshSessionParameters): Promise<Error | (RefreshSession & { user: UserOutput })> => {
  const refreshSessions = await refreshSessionRepository.getAllByUserId(userId);

  if (refreshSessions instanceof Error) {
    return refreshSessions;
  }

  if (refreshSessions.length >= 5) {
    logger('The user has more than 5 simultaneous sessions 🚨');
    logger(JSON.stringify({ userId }, null, 2));

    await refreshSessionRepository.removeAllByUserId(userId);
  }

  const code = createCode(CodeType.REFRESH_TOKEN);

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

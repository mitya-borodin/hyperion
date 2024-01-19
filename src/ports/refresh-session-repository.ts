import { RefreshSession } from '../domain/refresh-session';

import { UserOutput } from './user-repository';

export type CreateRefreshSession = Pick<RefreshSession, 'fingerprint' | 'userId' | 'refreshToken' | 'expiresIn'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRefreshSessionRepository {
  create(parameters: CreateRefreshSession): Promise<(RefreshSession & { user: UserOutput }) | Error>;

  getByRefreshToken(refreshToken: string): Promise<RefreshSession | Error>;

  getAllByUserId(userId: string): Promise<RefreshSession[] | Error>;

  removeByRefreshToken(refreshToken: string): Promise<RefreshSession | Error>;

  removeAllByUserId(userId: string): Promise<void | Error>;
}

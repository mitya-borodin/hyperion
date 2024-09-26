import { RefreshSession } from '../domain/refresh-session';

import { UserOutput } from './user-port';

export type CreateRefreshSession = Pick<RefreshSession, 'fingerprint' | 'userId' | 'refreshToken' | 'expiresIn'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface RefreshSessionPort {
  create(parameters: CreateRefreshSession): Promise<(RefreshSession & { user: UserOutput }) | Error>;

  getByRefreshToken(refreshToken: string): Promise<RefreshSession | Error>;

  getAllByUserId(userId: string): Promise<RefreshSession[] | Error>;

  removeByRefreshToken(refreshToken: string): Promise<RefreshSession | Error>;

  removeAllByUserId(userId: string): Promise<void | Error>;
}

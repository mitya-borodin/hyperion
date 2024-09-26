import { PrismaClient } from '@prisma/client';
import debug from 'debug';
import omit from 'lodash.omit';

import { RefreshSession } from '../../../domain/refresh-session';
import { ErrorType } from '../../../helpers/error-type';
import { CreateRefreshSession, RefreshSessionPort } from '../../../ports/refresh-session-port';
import { UserOutput } from '../../../ports/user-port';
import { toDomainUser } from '../../mappers/user-mapper';

const logger = debug('hyperion-refresh-session-repository');

export type RefreshSessionRepositoryParameters = {
  client: PrismaClient;
};

export class RefreshSessionRepository implements RefreshSessionPort {
  private client: PrismaClient;

  constructor({ client }: RefreshSessionRepositoryParameters) {
    this.client = client;
  }

  async create(parameters: CreateRefreshSession): Promise<Error | (RefreshSession & { user: UserOutput })> {
    try {
      const refreshSession = await this.client.refreshSession.create({
        include: {
          user: true,
        },
        data: {
          fingerprint: parameters.fingerprint,
          userId: parameters.userId,
          refreshToken: parameters.refreshToken,
          expiresIn: parameters.expiresIn,
        },
      });

      return { ...refreshSession, user: omit(toDomainUser(refreshSession.user), ['hash', 'salt']) };
    } catch (error) {
      logger('The refresh session was not created 🚨');
      logger(JSON.stringify({ parameters, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async getByRefreshToken(refreshToken: string): Promise<Error | RefreshSession> {
    try {
      return this.client.refreshSession.findUniqueOrThrow({
        where: {
          refreshToken,
        },
      });
    } catch (error) {
      logger('The refresh session was not found by refreshToken 🚨');
      logger(JSON.stringify({ refreshToken, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async getAllByUserId(userId: string): Promise<Error | RefreshSession[]> {
    try {
      return this.client.refreshSession.findMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      logger('The refresh session was not found by user id 🚨');
      logger(JSON.stringify({ userId, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async removeByRefreshToken(refreshToken: string): Promise<Error | RefreshSession> {
    try {
      return this.client.refreshSession.delete({
        where: { refreshToken },
      });
    } catch (error) {
      logger('The refresh session was not removed by refreshToken 🚨');
      logger(JSON.stringify({ refreshToken, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async removeAllByUserId(userId: string): Promise<Error | void> {
    try {
      await this.client.refreshSession.deleteMany({
        where: { userId },
      });
    } catch (error) {
      logger('The refresh session was not removed by userId 🚨');
      logger(JSON.stringify({ userId, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }
}

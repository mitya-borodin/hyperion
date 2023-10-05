import { PrismaClient } from '@prisma/client';
import omit from 'lodash.omit';
import { Logger } from 'pino';

import { RefreshSession } from '../../../domain/refresh-session';
import { ErrorType } from '../../../helpers/error-type';
import { CreateRefreshSession, IRefreshSessionRepository } from '../../../ports/refresh-session-repository';
import { UserOutput } from '../../../ports/user-repository';
import { toDomainUser } from '../../mappers/user-mapper';

export type RefreshSessionRepositoryParameters = {
  logger: Logger;
  client: PrismaClient;
};

export class RefreshSessionRepository implements IRefreshSessionRepository {
  private logger: Logger;
  private client: PrismaClient;

  constructor({ logger, client }: RefreshSessionRepositoryParameters) {
    this.logger = logger.child({ name: 'RefreshSessionRepository' });
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
      this.logger.error({ parameters, err: error }, 'The refresh session was not created 🚨');

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
      this.logger.error({ refreshToken, err: error }, 'The refresh session was not found by refreshToken 🚨');

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
      this.logger.error({ userId, err: error }, 'The refresh session was not found by user id 🚨');

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async removeByRefreshToken(refreshToken: string): Promise<Error | RefreshSession> {
    try {
      return this.client.refreshSession.delete({
        where: { refreshToken },
      });
    } catch (error) {
      this.logger.error({ refreshToken, err: error }, 'The refresh session was not removed by refreshToken 🚨');

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async removeAllByUserId(userId: string): Promise<Error | void> {
    try {
      await this.client.refreshSession.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error({ userId, err: error }, 'The refresh session was not removed by userId 🚨');

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }
}

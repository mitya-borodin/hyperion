/* eslint-disable unicorn/no-null */
import { PrismaClient } from '@prisma/client';
import debug from 'debug';
import omit from 'lodash.omit';

import { User, UserStatus } from '../../../domain/user';
import { ErrorType } from '../../../helpers/error-type';
import { FindParameters, FindResult } from '../../../helpers/find-types';
import {
  CreateUserParameters,
  IUserRepository,
  UpdateUserParameters,
  UserOutput,
} from '../../../ports/user-repository';
import { Config } from '../../config';
import { toDomainUser } from '../../mappers/user-mapper';

const logger = debug('hyperion-user-repository');

export type UserRepositoryParameters = {
  config: Config;
  client: PrismaClient;
};

export class UserRepository implements IUserRepository {
  private config: Config;
  private client: PrismaClient;

  constructor({ config, client }: UserRepositoryParameters) {
    this.config = config;
    this.client = client;
  }

  async get(id: string): Promise<Error | User> {
    try {
      const prismaUser = await this.client.user.findUniqueOrThrow({ where: { id } });

      return toDomainUser(prismaUser);
    } catch (error) {
      logger('The user was not found by id 🚨');
      logger(JSON.stringify({ id, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async getByEmail(email: string): Promise<Error | User | null> {
    try {
      const prismaUser = await this.client.user.findFirst({ where: { email } });

      if (!prismaUser) {
        return null;
      }

      return toDomainUser(prismaUser);
    } catch (error) {
      logger('The user was not found by email 🚨');
      logger(JSON.stringify({ email, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async find(parameters: FindParameters): Promise<Error | FindResult<User>> {
    try {
      const [prismaUsers, total] = await this.client.$transaction([
        this.client.user.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          skip: (parameters.pagination.page - 1) * parameters.pagination.limit,
          take: parameters.pagination.limit,
        }),
        this.client.user.count(),
      ]);

      return {
        items: prismaUsers.map((prismaUser) => toDomainUser(prismaUser)),
        pagination: {
          total,
          limit: parameters.pagination.limit,
          page: parameters.pagination.page,
        },
      };
    } catch (error) {
      logger('The users was not found 🚨');
      logger(JSON.stringify({ err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async create(parameters: CreateUserParameters): Promise<Error | UserOutput> {
    try {
      const prismaUser = await this.client.user.create({
        data: {
          name: parameters.name,
          email: parameters.email,
          role: parameters.role,
          status: UserStatus.ACTIVE,
          hash: parameters.hash,
          salt: parameters.salt,
        },
      });

      return omit(toDomainUser(prismaUser), ['hash', 'salt']);
    } catch (error) {
      logger('The user was not created 🚨');
      logger(JSON.stringify({ parameters, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async update(parameters: UpdateUserParameters): Promise<Error | Omit<User, 'hash' | 'salt'>> {
    try {
      const prismaUser = await this.client.user.update({
        where: { id: parameters.id },
        data: {
          name: parameters.name,
          email: parameters.email,
          role: parameters.role,
          status: parameters.status,
          isTwoFaActivated: parameters.isTwoFaActivated,
          twoFaSecret: parameters.twoFaSecret,
          hash: parameters.hash,
          salt: parameters.salt,
        },
      });

      return omit(toDomainUser(prismaUser), ['hash', 'salt']);
    } catch (error) {
      logger('The user was not updated 🚨');
      logger(JSON.stringify({ parameters, err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  async delete(id: string): Promise<Error | UserOutput> {
    try {
      const prismaUser = await this.client.user.update({
        where: { id },
        data: {
          status: UserStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      return toDomainUser(prismaUser);
    } catch (error) {
      logger('The user was not deleted 🚨');
      logger(JSON.stringify({ err: error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }
}

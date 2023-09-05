import { PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

import { Settings, SettingType } from '../../../domain/settings';
import { ErrorType } from '../../../helpers/error-type';
import { CreateSettingParameters, ISettingsRepository } from '../../../ports/settings-repository';
import { toDomainSettings } from '../../mappers/settings-mapper';

export type SettingsRepositoryParameters = {
  logger: Logger;
  client: PrismaClient;
};

export class SettingsRepository implements ISettingsRepository {
  private logger: Logger;
  private client: PrismaClient;

  constructor({ logger, client }: SettingsRepositoryParameters) {
    this.logger = logger.child({ name: 'SettingsRepository' });
    this.client = client;
  }

  async create(parameters: CreateSettingParameters): Promise<Settings | Error> {
    try {
      const prismaSetting = await this.client.settings.create({
        data: {
          name: parameters.key,
          value: parameters.value,
        },
      });

      return toDomainSettings(prismaSetting);
    } catch (error) {
      this.logger.error({ parameters, err: error }, 'Failed to create the setting 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async hasSeed(): Promise<boolean | Error> {
    try {
      const prismaSetting = await this.client.settings.findUniqueOrThrow({
        where: {
          name: SettingType.SEED_IS_COMPLETE,
        },
      });

      return Boolean(prismaSetting.value);
    } catch (error) {
      this.logger.error({ err: error }, 'Could not find the SEED_IS_COMPLETE setting 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

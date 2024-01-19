import { PrismaClient } from '@prisma/client';
import debug from 'debug';

import { Settings, SettingType } from '../../../domain/settings';
import { ErrorType } from '../../../helpers/error-type';
import { CreateSettingParameters, ISettingsRepository } from '../../../ports/settings-repository';
import { toDomainSettings } from '../../mappers/settings-mapper';

const logger = debug('hyperion-settings-repository');

export type SettingsRepositoryParameters = {
  client: PrismaClient;
};

export class SettingsRepository implements ISettingsRepository {
  private client: PrismaClient;

  constructor({ client }: SettingsRepositoryParameters) {
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
      logger('Failed to create the setting 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

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
      logger('Could not find the SEED_IS_COMPLETE setting 🚨');
      logger(JSON.stringify({ error }, null, 2));

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

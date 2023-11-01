import { PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

import { ErrorType } from '../../../helpers/error-type';
import { IMacrosSettingsRepository, MacrosSettings } from '../../../ports/macros-settings-repository';
import { toDomainMacrosSettings } from '../../mappers/macros-settings-mapper';

export type MacrosSettingsRepositoryParameters = {
  logger: Logger;
  client: PrismaClient;
};

export class MacrosSettingsRepository implements IMacrosSettingsRepository {
  private logger: Logger;
  private client: PrismaClient;

  constructor({ logger, client }: MacrosSettingsRepositoryParameters) {
    this.logger = logger.child({ name: 'MacrosSettingsRepository' });
    this.client = client;
  }

  async upsert(parameters: MacrosSettings): Promise<Error | MacrosSettings> {
    try {
      const prismaMacrosSetting = await this.client.macros.upsert({
        where: {
          id: parameters.id,
        },
        create: {
          type: parameters.type,
          name: parameters.name,
          description: parameters.description,
          labels: parameters.labels,
          settings: parameters.settings,
        },
        update: {
          id: parameters.id,
          type: parameters.type,
          name: parameters.name,
          description: parameters.description,
          labels: parameters.labels,
          settings: parameters.settings,
        },
      });

      return toDomainMacrosSettings(prismaMacrosSetting);
    } catch (error) {
      this.logger.error({ parameters, err: error }, 'Failed to upsert macros settings 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async remove(id: string): Promise<Error | MacrosSettings> {
    try {
      const prismaMacrosSetting = await this.client.macros.delete({
        where: {
          id,
        },
      });

      return toDomainMacrosSettings(prismaMacrosSetting);
    } catch (error) {
      this.logger.error({ id, err: error }, 'Failed to remove macros settings 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

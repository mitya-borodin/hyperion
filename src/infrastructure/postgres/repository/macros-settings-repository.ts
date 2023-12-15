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

  async getAll(): Promise<Error | MacrosSettings[]> {
    try {
      const prismaMacrosSettings = await this.client.macros.findMany();

      return prismaMacrosSettings.map((prismaMacrosSetting) => toDomainMacrosSettings(prismaMacrosSetting));
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to get all macros settings 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
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

  async destroy(id: string): Promise<Error | MacrosSettings> {
    try {
      const [prismaMacrosSetting] = await this.client.$transaction([
        this.client.macros.delete({
          where: {
            id,
          },
        }),
        this.client.device.deleteMany({
          where: {
            deviceId: id,
          },
        }),
        this.client.control.deleteMany({
          where: {
            deviceId: id,
          },
        }),
        this.client.history.deleteMany({
          where: {
            deviceId: id,
          },
        }),
      ]);

      return toDomainMacrosSettings(prismaMacrosSetting);
    } catch (error) {
      this.logger.error({ id, err: error }, 'Failed to destroy macros settings 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

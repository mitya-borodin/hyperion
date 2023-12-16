import { PrismaClient } from '@prisma/client';
import debug from 'debug';

import { ErrorType } from '../../../helpers/error-type';
import { IMacrosSettingsRepository, MacrosSettings } from '../../../ports/macros-settings-repository';
import { toDomainMacrosSettings } from '../../mappers/macros-settings-mapper';

const logger = debug('macros-settings-repository');

export type MacrosSettingsRepositoryParameters = {
  client: PrismaClient;
};

export class MacrosSettingsRepository implements IMacrosSettingsRepository {
  private client: PrismaClient;

  constructor({ client }: MacrosSettingsRepositoryParameters) {
    this.client = client;
  }

  async getAll(): Promise<Error | MacrosSettings[]> {
    try {
      const prismaMacrosSettings = await this.client.macros.findMany();

      return prismaMacrosSettings.map((prismaMacrosSetting) => toDomainMacrosSettings(prismaMacrosSetting));
    } catch (error) {
      logger('Failed to get all macros settings 🚨');
      logger(JSON.stringify({ error }, null, 2));

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
          id: parameters.id,
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
      logger('Failed to upsert macros settings 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

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
      logger('Failed to destroy macros settings 🚨');
      logger(JSON.stringify({ id, error }, null, 2));

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

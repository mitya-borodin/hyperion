import { PrismaClient } from '@prisma/client';
import debug from 'debug';

import { ErrorType } from '../../../helpers/error-type';
import { JsonValue } from '../../../helpers/json-types';
import { IMacrosSettingsRepository, MacrosSettings } from '../../../ports/macros-settings-repository';
import { toDomainMacrosSettings } from '../../mappers/macros-settings-mapper';

const logger = debug('hyperion-macros-settings-repository');

export type MacrosSettingsRepositoryParameters = {
  client: PrismaClient;
};

export class MacrosSettingsRepository implements IMacrosSettingsRepository {
  private client: PrismaClient;

  constructor({ client }: MacrosSettingsRepositoryParameters) {
    this.client = client;
  }

  async getAll(): Promise<MacrosSettings[]> {
    try {
      const prismaMacrosEject = await this.client.macros.findMany();

      return prismaMacrosEject.map((prismaMacrosEject) => toDomainMacrosSettings(prismaMacrosEject));
    } catch (error) {
      logger('Failed to get all macros settings 🚨');
      logger(JSON.stringify({ error }, null, 2));

      return [];
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

          id: parameters.id,
          name: parameters.name,
          description: parameters.description,
          labels: parameters.labels,

          settings: parameters.settings as JsonValue,
        },
        update: {
          type: parameters.type,

          id: parameters.id,
          name: parameters.name,
          description: parameters.description,
          labels: parameters.labels,

          settings: parameters.settings as JsonValue,
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

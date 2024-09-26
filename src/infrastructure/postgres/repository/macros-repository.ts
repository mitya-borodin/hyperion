import { PrismaClient } from '@prisma/client';

import { ErrorType } from '../../../helpers/error-type';
import { JsonValue } from '../../../helpers/json-types';
import { MacrosPort, MacrosData, MacrosState } from '../../../ports/macros-settings-port';
import { getLogger } from '../../logger';
import { toDomainMacrosSettings } from '../../mappers/macros-settings-mapper';

const logger = getLogger('hyperion-macros-repository');

export type MacrosRepositoryParameters = {
  client: PrismaClient;
};

export class MacrosRepository implements MacrosPort {
  private client: PrismaClient;

  constructor({ client }: MacrosRepositoryParameters) {
    this.client = client;
  }

  async getAll(): Promise<MacrosData[]> {
    try {
      const prismaMacrosEject = await this.client.macros.findMany();

      return prismaMacrosEject.map((prismaMacrosEject) => toDomainMacrosSettings(prismaMacrosEject));
    } catch (error) {
      logger.error('Failed to get all macros settings 🚨');
      logger.error({ error });

      return [];
    }
  }

  async upsert(parameters: MacrosData): Promise<Error | MacrosData> {
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
          state: parameters.state as JsonValue,

          version: parameters.version,
        },
        update: {
          type: parameters.type,

          id: parameters.id,
          name: parameters.name,
          description: parameters.description,
          labels: parameters.labels,

          settings: parameters.settings as JsonValue,
          state: parameters.state as JsonValue,

          version: parameters.version,
        },
      });

      return toDomainMacrosSettings(prismaMacrosSetting);
    } catch (error) {
      logger.error('Failed to upsert macros settings 🚨');
      logger.error({ parameters, error });

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async saveState(parameters: MacrosState): Promise<Error | MacrosData> {
    try {
      const prismaMacrosSetting = await this.client.macros.update({
        where: {
          id: parameters.id,
        },
        data: {
          state: parameters.state as JsonValue,
        },
      });

      return toDomainMacrosSettings(prismaMacrosSetting);
    } catch (error) {
      logger.error('Failed to update macros state 🚨');
      logger.error({ parameters, error });

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async destroy(id: string): Promise<Error | MacrosData> {
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
      logger.error('Failed to destroy macros settings 🚨');
      logger.error({ id, error });

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

import { Logger } from 'pino';
import { Connection } from 'rethinkdb-ts';

import { LightingGroup, LightingGroupState } from '../../../domain/lighting/lighting-group';
import { COMMON_RELAY_NAME } from '../../../domain/wirenboard/relays';
import { Errors } from '../../../enums/errors';
import { ILightingRepository } from '../../../ports/lighting-repository';
import { checkWriteResult } from '../common';
import { lightingGroupTable } from '../tables/lighting-group';

export class LightingRepository implements ILightingRepository {
  private readonly rethinkdbConnection: Connection;
  private readonly logger: Logger;

  constructor(rethinkdbConnection: Connection, logger: Logger) {
    this.rethinkdbConnection = rethinkdbConnection;
    this.logger = logger.child({ name: 'lighting-repository' });
  }

  async getLightingGroups(): Promise<LightingGroup[] | Error> {
    try {
      return lightingGroupTable.run(this.rethinkdbConnection);
    } catch (error) {
      this.logger.error(error);
    }

    return new Error(Errors.UNEXPECTED_BEHAVIOR);
  }

  async getLightingGroup(location: string): Promise<LightingGroup | Error> {
    try {
      const readResult = await lightingGroupTable.get(location).run(this.rethinkdbConnection);

      if (readResult === null) {
        this.logger.error({ location }, 'Lighting group not found');

        return new Error(Errors.INVALID_ARGUMENTS);
      }

      return readResult;
    } catch (error) {
      this.logger.error(error);
    }

    return new Error(Errors.UNEXPECTED_BEHAVIOR);
  }

  async createLightingGroups(locations: string[]): Promise<LightingGroup[] | Error> {
    try {
      const writeResult = await lightingGroupTable
        .insert(
          locations.map((location) => ({
            location,
            relays: [],
            state: LightingGroupState.OFF,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          { returnChanges: 'always' },
        )
        .run(this.rethinkdbConnection);

      return checkWriteResult({ logger: this.logger, loggerContext: { locations }, writeResult });
    } catch (error) {
      this.logger.error(error);

      return new Error(Errors.UNEXPECTED_BEHAVIOR);
    }
  }

  async removeLightingGroups(locations: string[]): Promise<LightingGroup[] | Error> {
    try {
      const writeResult = await lightingGroupTable.getAll(locations).delete().run(this.rethinkdbConnection);

      return checkWriteResult({ logger: this.logger, loggerContext: { locations }, writeResult });
    } catch (error) {
      this.logger.error(error);

      return new Error(Errors.UNEXPECTED_BEHAVIOR);
    }
  }

  async setRelayToGroup(location: string, relays: COMMON_RELAY_NAME[]): Promise<LightingGroup[] | Error> {
    try {
      const writeResult = await lightingGroupTable.get(location).update({ relays }).run(this.rethinkdbConnection);

      return checkWriteResult({ logger: this.logger, loggerContext: { location }, writeResult });
    } catch (error) {
      this.logger.error(error);

      return new Error(Errors.UNEXPECTED_BEHAVIOR);
    }
  }

  async turnGroups(locations: string[], state: LightingGroupState): Promise<LightingGroup[] | Error> {
    try {
      const writeResult = await lightingGroupTable.getAll(locations).update({ state }).run(this.rethinkdbConnection);

      return checkWriteResult({ logger: this.logger, loggerContext: { locations }, writeResult });
    } catch (error) {
      this.logger.error(error);

      return new Error(Errors.UNEXPECTED_BEHAVIOR);
    }
  }
}

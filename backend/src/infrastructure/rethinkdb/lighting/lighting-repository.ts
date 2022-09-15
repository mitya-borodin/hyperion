import { Logger } from "pino";
import { Connection, r } from "rethinkdb-ts";

import { Errors } from "../../../domain/errors";
import { LightingGroup, LightingGroupState } from "../../../domain/lighting/lighting-group";
import { ILightingRepository } from "../../../domain/lighting/lighting-repository";
import { COMMON_RELAY_NAME } from "../../../domain/wirenboard/relays";
import { LightingGroupTable, lightingGroupTable } from "../tables/lighting-group";
import { checkWriteResult } from "../utils";

export class LightingRepository implements ILightingRepository {
  private readonly rethinkdbConnection: Connection;
  private readonly logger: Logger;

  constructor(rethinkdbConnection: Connection, logger: Logger) {
    this.rethinkdbConnection = rethinkdbConnection;
    this.logger = logger.child({ name: "lighting-repository" });
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
        this.logger.error({ location }, "Lighting group not found");

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
            createdAt: r.now(),
            updatedAt: r.now(),
          })),
          { returnChanges: "always" },
        )
        .run(this.rethinkdbConnection);

      return checkWriteResult({ logger: this.logger, loggerContext: { locations }, writeResult });
    } catch (error) {
      this.logger.error(error);

      return new Error(Errors.UNEXPECTED_BEHAVIOR);
    }
  }

  removeLightingGroups(locations: string[]): Promise<Error | undefined> {
    throw new Error("Method not implemented.");
  }

  addRelayToGroup(location: string, relays: COMMON_RELAY_NAME[]): Promise<LightingGroup | Error> {
    throw new Error("Method not implemented.");
  }

  removeRelayFromGroup(
    location: string,
    relays: COMMON_RELAY_NAME[],
  ): Promise<LightingGroup | Error> {
    throw new Error("Method not implemented.");
  }

  turnOnGroups(location: string[]): Promise<LightingGroup[] | Error> {
    throw new Error("Method not implemented.");
  }

  turnOffGroups(location: string[]): Promise<LightingGroup[] | Error> {
    throw new Error("Method not implemented.");
  }
}

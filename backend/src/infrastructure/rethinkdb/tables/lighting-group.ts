import { Connection } from "rethinkdb-ts";

import { LightingGroupState } from "../../../domain/lighting/lighting-group";
import { COMMON_RELAY_NAME } from "../../../domain/wirenboard/relays";
import { createTable, db } from "../common";

const tableName = "lighting-group";

export type LightingGroupTable = {
  readonly location: string;
  readonly relays: COMMON_RELAY_NAME[];
  readonly state: LightingGroupState;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const lightingGroupTable = db.table<LightingGroupTable>(tableName);

export async function createLightingGroupTableTable(
  rethinkdbConnection: Connection,
  tableReplicas: number,
): Promise<void> {
  await createTable(rethinkdbConnection, tableName, "location", tableReplicas);
}

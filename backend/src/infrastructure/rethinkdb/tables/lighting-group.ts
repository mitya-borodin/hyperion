import { Connection } from "rethinkdb-ts";

import { LightingGroupState } from "../../../domain/lighting/lighting-group";
import { createTable, db } from "../common";

const tableName = "lighting-group";

export type LightingGroupTable = {
  readonly location: string;
  readonly state: LightingGroupState;
  readonly devices: string[];
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

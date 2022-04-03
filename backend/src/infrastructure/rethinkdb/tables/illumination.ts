import { Connection } from "rethinkdb-ts";

import { createTable, db } from "..";

const tableName = "illumination";

export type Illumination = {
  /**
   * illuminationID is unique name of illumination.
   */
  readonly id: string;
  readonly location: string;
  readonly state: "on" | "off";
  readonly totalDuration: string;
  readonly needToReplaceLamp: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const illuminationTable = db.table<Illumination>(tableName);

export async function createIlluminationTable(
  rethinkdbConnection: Connection,
  tableReplicas: number,
): Promise<void> {
  await createTable(rethinkdbConnection, tableName, "id", tableReplicas);
}

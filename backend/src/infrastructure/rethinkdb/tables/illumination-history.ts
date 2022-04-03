import { Connection } from "rethinkdb-ts";

import { createTable, db } from "..";

const tableName = "illumination-history";

export type IlluminationHistory = {
  readonly id: string;
  /**
   * illuminationID is unique name of illumination.
   */
  readonly illuminationID: string;
  readonly turnedOnAt: string;
  readonly turnedOffAt: string;
  readonly duration: string;
};

export const illuminationHistoryTable = db.table<IlluminationHistory>(tableName);

export async function createIlluminationHistoryTable(
  rethinkdbConnection: Connection,
  tableReplicas: number,
): Promise<void> {
  await createTable(rethinkdbConnection, tableName, "id", tableReplicas);
}

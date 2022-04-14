import { Connection } from "rethinkdb-ts";

import { createDB } from "./common";
import { createIlluminationTable } from "./tables/illumination";
import { createIlluminationHistoryTable } from "./tables/illumination-history";

export const initRethinkdbSchema = async (rethinkdbConnection: Connection) => {
  await createDB(rethinkdbConnection);
  await createIlluminationTable(rethinkdbConnection, 1);
  await createIlluminationHistoryTable(rethinkdbConnection, 1);
};

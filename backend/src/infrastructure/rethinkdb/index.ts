import { Connection } from "rethinkdb-ts";

import { createDB } from "./common";
import { createLightingDeviceTable } from "./tables/lighting-device";
import { createLightingGroupTableTable } from "./tables/lighting-group";

export const initRethinkdbSchema = async (rethinkdbConnection: Connection) => {
  await createDB(rethinkdbConnection);
  await createLightingDeviceTable(rethinkdbConnection, 1);
  await createLightingGroupTableTable(rethinkdbConnection, 1);
};

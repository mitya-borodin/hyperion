import { Connection } from 'rethinkdb-ts';

import { createDB } from './common';
import { createLightingGroupTableTable } from './tables/lighting-group';

export const initRethinkdbSchema = async (rethinkdbConnection: Connection) => {
  await createDB(rethinkdbConnection);
  await createLightingGroupTableTable(rethinkdbConnection, 1);
};

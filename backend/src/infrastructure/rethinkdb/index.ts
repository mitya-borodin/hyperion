import { retry, throwIfAborted } from "abort-controller-x";
import { AbortSignal } from "node-abort-controller";
import { Logger } from "pino";
import { Connection, IndexOptions, r, RConnectionOptions, RDatum, RTable } from "rethinkdb-ts";

import { createIlluminationTable } from "./tables/illumination";
import { createIlluminationHistoryTable } from "./tables/illumination-history";

const dbName = "butler";

export const db = r.db(dbName);

export async function createDB(rethinkdbConnection: Connection): Promise<void> {
  await r
    .dbList()
    .contains(dbName)
    .do((hasDb: RDatum<boolean>) => r.branch(hasDb, { created: 0 }, r.dbCreate(dbName)))
    .run(rethinkdbConnection);
}

export async function createTable(
  rethinkdbConnection: Connection,
  tableName: string,
  primaryKey: string,
  replicas: number,
  shards = 1,
): Promise<void> {
  await db
    .tableList()
    .contains(tableName)
    .do((hasTable: RDatum<boolean>) =>
      r.branch(
        hasTable,
        { created: 0 },
        db.tableCreate(tableName, {
          shards,
          replicas,
          primaryKey,
        }),
      ),
    )
    .run(rethinkdbConnection);
}

export async function createIndex<T>(
  rethinkdbConnection: Connection,
  table: RTable<T>,
  indexName: string,
  indexFunction: (row: RDatum<T>) => RDatum,
  options: IndexOptions = {},
): Promise<void> {
  await table
    .indexList()
    .contains(indexName)
    .do((hasIndex: RDatum<boolean>) =>
      r.branch(
        hasIndex,
        { created: 0 },
        table.indexCreate(indexName, indexFunction, options).do(() => table.indexWait(indexName)),
      ),
    )
    .run(rethinkdbConnection);
}

export const initRethinkdbSchema = async (rethinkdbConnection: Connection) => {
  await createDB(rethinkdbConnection);
  await createIlluminationTable(rethinkdbConnection, 1);
  await createIlluminationHistoryTable(rethinkdbConnection, 1);
};

export function connectToRethinkDb(
  signal: AbortSignal,
  options: RConnectionOptions,
  logger: Logger,
): Promise<Connection> {
  return retry(
    signal,
    async (signal) => {
      const connection = await r.connect(options);

      if (signal.aborted) {
        await connection.close();

        throwIfAborted(signal);
      }

      logger.debug("Connection to RethinkDB has been established");

      return connection;
    },
    {
      onError(error, attempt, delayMs) {
        logger.error({ error, attempt, delayMs }, "Failed to connect to RethinkDB, retrying");
      },
    },
  );
}

export function reconnectToRethinkDb(
  signal: AbortSignal,
  connection: Connection,
  logger: Logger,
): Promise<void> {
  return retry(
    signal,
    async (signal) => {
      await connection.reconnect();

      if (signal.aborted) {
        await connection.close();

        throwIfAborted(signal);
      }

      logger.debug("Connection to RethinkDB has been restored");
    },
    {
      onError(error, attempt, delayMs) {
        logger.error({ error, attempt, delayMs }, "Failed to reconnect to RethinkDB, retrying");
      },
    },
  );
}

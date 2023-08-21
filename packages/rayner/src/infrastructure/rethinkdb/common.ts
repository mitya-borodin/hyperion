/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/prevent-abbreviations */
import { retry, throwIfAborted } from 'abort-controller-x';
import { Logger } from 'pino';
import { Connection, IndexOptions, r, RConnectionOptions, RDatum, RTable, WriteResult } from 'rethinkdb-ts';

import { Errors } from '../../enums/errors';

const databaseName = 'rayner';

export const database = r.db(databaseName);

export async function createDB(rethinkdbConnection: Connection): Promise<void> {
  await r
    .dbList()
    .contains(databaseName)
    .do((hasDatabase: RDatum<boolean>) => r.branch(hasDatabase, { created: 0 }, r.dbCreate(databaseName)))
    .run(rethinkdbConnection);
}

export async function createTable(
  rethinkdbConnection: Connection,
  tableName: string,
  primaryKey: string,
  replicas: number,
  shards = 1,
): Promise<void> {
  await database
    .tableList()
    .contains(tableName)
    .do((hasTable: RDatum<boolean>) =>
      r.branch(
        hasTable,
        { created: 0 },
        database.tableCreate(tableName, {
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

      logger.debug('Connection to RethinkDB has been established');

      return connection;
    },
    {
      onError(error, attempt, delayMs) {
        logger.error({ error, attempt, delayMs }, 'Failed to connect to RethinkDB, retrying');
      },
    },
  );
}

export function reconnectToRethinkDb(signal: AbortSignal, connection: Connection, logger: Logger): Promise<void> {
  return retry(
    signal,
    async (signal) => {
      await connection.reconnect();

      if (signal.aborted) {
        await connection.close();

        throwIfAborted(signal);
      }

      logger.debug('Connection to RethinkDB has been restored');
    },
    {
      onError(error, attempt, delayMs) {
        logger.error({ error, attempt, delayMs }, 'Failed to reconnect to RethinkDB, retrying');
      },
    },
  );
}

type CheckWriteResultParameters<T> = {
  logger: Logger;
  loggerContext?: any;
  writeResult: WriteResult<T | null>;
};

export const checkWriteResult = <T>({
  logger,
  loggerContext = {},
  writeResult,
}: CheckWriteResultParameters<T>): T[] | Error => {
  if (!writeResult.changes || writeResult.first_error) {
    logger.error({ ...loggerContext, writeResult }, "Lighting groups wasn't created 🚨");

    return new Error(Errors.UNEXPECTED_BEHAVIOR);
  }

  const result: T[] = [];

  for (const { new_val } of writeResult.changes) {
    if (new_val) {
      result.push(new_val);
    }
  }

  logger.debug({ ...loggerContext, writeResult }, 'Lighting groups was created successful ✅');

  return result;
};

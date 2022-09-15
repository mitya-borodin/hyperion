import { Logger } from "pino";
import { WriteResult } from "rethinkdb-ts";

import { Errors } from "../../domain/errors";

type CheckWriteResultParams<T> = {
  logger: Logger;
  loggerContext?: any;
  writeResult: WriteResult<T>;
};

export const checkWriteResult = <T>({
  logger,
  loggerContext = {},
  writeResult,
}: CheckWriteResultParams<T>): T[] | Error => {
  if (!writeResult.changes || writeResult.first_error) {
    logger.error({ ...loggerContext, writeResult }, "Lighting groups wasn't created 🚨");

    return new Error(Errors.UNEXPECTED_BEHAVIOR);
  }

  const result: T[] = [];

  writeResult.changes.forEach(({ new_val }) => {
    if (new_val) {
      result.push(new_val);
    }
  });

  logger.debug({ ...loggerContext, writeResult }, "Lighting groups was created successful ✅");

  return result;
};

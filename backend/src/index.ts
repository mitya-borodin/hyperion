import { AbortController } from "node-abort-controller";
import pino from "pino";

import { config } from "./infrastructure/config";
import { connectToRethinkDb } from "./infrastructure/rethinkdb";

const logger = pino({ name: "entrypoint" });

// ! This is entrypoint of whole application
// TODO Need implement wrapper which will control graceful shutdown and catch unexpected errors.

(async () => {
  const abortController = new AbortController();

  const rethinkdbConnection = await connectToRethinkDb(
    abortController.signal,
    {
      host: config.rethinkdb.host,
      password: config.rethinkdb.host,
    },
    logger.child({ name: "rethinkdbConnection" }),
  );
})();

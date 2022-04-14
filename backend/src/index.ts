import { forever, waitForEvent } from "abort-controller-x";

import { config } from "./infrastructure/config";
import { entrypoint } from "./infrastructure/entrypoint";
import { initRethinkdbSchema } from "./infrastructure/rethinkdb";
import { connectToRethinkDb, reconnectToRethinkDb } from "./infrastructure/rethinkdb/common";
import { createHttpInterface } from "./interfaces/http";

entrypoint(async ({ signal, logger, defer, fork }) => {
  const rethinkdbConnection = await connectToRethinkDb(
    signal,
    {
      host: config.rethinkdb.host,
      port: config.rethinkdb.port,
    },
    logger.child({ name: "connectToRethinkDb" }),
  );

  fork(async (signal) => {
    while (true) {
      await waitForEvent(signal, rethinkdbConnection, "close");
      await reconnectToRethinkDb(
        signal,
        rethinkdbConnection,
        logger.child({ name: "reconnectToRethinkDb" }),
      );
    }
  });

  defer(() => rethinkdbConnection.close());

  await initRethinkdbSchema(rethinkdbConnection);

  const fastify = createHttpInterface({
    config,
    rethinkdbConnection,
    logger: logger.child({ name: "httpServer" }),
  });

  await fastify.listen(config.fastify.port, config.fastify.host);

  defer(() => fastify.close());

  await forever(signal);
});

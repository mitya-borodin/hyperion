import { forever, waitForEvent } from "abort-controller-x";

import { config } from "./infrastructure/config";
import { entrypoint } from "./infrastructure/entrypoint";
import { connectToRethinkDb, reconnectToRethinkDb } from "./infrastructure/rethinkdb";
import { createHttpInterface } from "./interfaces/http";

entrypoint(async ({ signal, logger, defer, fork }) => {
  const rethinkdbConnection = await connectToRethinkDb(
    signal,
    {
      host: config.rethinkdb.host,
      password: config.rethinkdb.host,
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

  const fastify = createHttpInterface({
    config,
    rethinkdbConnection,
    logger: logger.child({ name: "httpServer" }),
  });

  const address = await fastify.listen(config.fastify.port, config.fastify.host);

  logger.info({ address }, "HTTP server is running");

  defer(() => fastify.close());

  await forever(signal);
});

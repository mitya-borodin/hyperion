import { forever, waitForEvent } from "abort-controller-x";

import { config } from "./infrastructure/config";
import { entrypoint } from "./infrastructure/entrypoint";
import { initRethinkdbSchema } from "./infrastructure/rethinkdb";
import { connectToRethinkDb, reconnectToRethinkDb } from "./infrastructure/rethinkdb/common";
import { LightingRepository } from "./infrastructure/rethinkdb/lighting/lighting-repository";
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

  await initRethinkdbSchema(rethinkdbConnection);

  const lightingRepository = new LightingRepository();

  const fastify = createHttpInterface({
    config,
    rethinkdbConnection,
    logger: logger.child({ name: "http-server" }),
    lightingRepository,
  });

  await fastify.listen(config.fastify.port, config.fastify.host);

  // ! First of all, you need to turn off the web server to avoid errors when accessing a closed rethinkdb connection
  defer(() => fastify.close());
  defer(() => rethinkdbConnection.close());

  await forever(signal);
});

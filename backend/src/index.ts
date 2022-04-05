import { config } from "./infrastructure/config";
import { entrypoint } from "./infrastructure/entrypoint";
import { connectToRethinkDb } from "./infrastructure/rethinkdb";

entrypoint(async ({ signal, logger, defer }) => {
  const rethinkdbConnection = await connectToRethinkDb(
    signal,
    {
      host: config.rethinkdb.host,
      password: config.rethinkdb.host,
    },
    logger.child({ name: "rethinkdbConnection" }),
  );

  defer(() => rethinkdbConnection.close());
});

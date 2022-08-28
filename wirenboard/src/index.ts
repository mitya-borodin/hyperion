import { forever } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";

entrypoint(async ({ signal, logger, defer, fork }) => {
  logger.info("ЗАПУСТИЛОСЬ");

  await forever(signal);
});

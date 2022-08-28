import { forever } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";

entrypoint(async ({ signal, logger, defer, fork }) => {
  console.log("ЗАПУСТИЛОСЬ ");

  await forever(signal);
});

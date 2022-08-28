import { statSync, writeFileSync } from "fs";

import { delay } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";

entrypoint(async ({ signal, logger, logFilePath, defer, fork }) => {
  while (true) {
    const logInBytes = statSync(logFilePath).size;
    const logInMegaBytes = logInBytes / (1024 * 1024);

    if (logInMegaBytes > 5) {
      writeFileSync(logFilePath, "", "utf8");
    }

    logger.info("PING");

    await delay(signal, 5_000);
  }
});

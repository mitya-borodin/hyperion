import { statSync, writeFileSync } from "fs";

import { delay } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";
import { ifup } from "./infrastructure/external-resource-adapters/ifup";
import { ping } from "./infrastructure/external-resource-adapters/ping";
import { removeEthRoute, setRoutes } from "./infrastructure/external-resource-adapters/routes";

const DELAY_MS = 5000;

entrypoint(async ({ signal, logger, logFilePath }) => {
  const ifupResult = await ifup({ logger });

  if (ifupResult instanceof Error) {
    return;
  }

  const setRoutesResult = await setRoutes({ logger });

  if (setRoutesResult instanceof Error) {
    return;
  }

  while (true) {
    const logInBytes = statSync(logFilePath).size;
    const logInMegaBytes = logInBytes / (1024 * 1024);

    if (logInMegaBytes > 5) {
      writeFileSync(logFilePath, "", "utf8");
    }

    const [ethPing, usbPing] = await Promise.all([
      ping({ logger, inet: "eth0" }),
      ping({ logger, inet: "usb0" }),
    ]);

    /**
     * ! Оба канала связи НЕ работают
     */
    if (ethPing instanceof Error && usbPing instanceof Error) {
      logger.error("None of the internet access options work 🚨");

      await delay(signal, DELAY_MS);

      continue;
    }

    if (ethPing instanceof Error) {
      /**
       * ! Не работает канал связи ETH0
       */

      await removeEthRoute({ logger });

      await delay(signal, DELAY_MS);

      continue;
    } else {
      /**
       * * Работает канал связи ETH0
       */
      await setRoutes({ logger });
    }

    await delay(signal, DELAY_MS);
  }
});

import { delay } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";
import { ifup } from "./infrastructure/external-resource-adapters/ifup";
import { ping } from "./infrastructure/external-resource-adapters/ping";
import {
  addEthRoute,
  removeEthRoute,
  resetRoutes,
} from "./infrastructure/external-resource-adapters/routes";

const DELAY_MS = 5000;

entrypoint(async ({ signal, logger }) => {
  const ifupResult = await ifup({ logger });

  if (ifupResult instanceof Error) {
    return;
  }

  const resetRoutesResult = await resetRoutes({ logger });

  if (resetRoutesResult instanceof Error) {
    return;
  }

  while (true) {
    const ethPing = await ping({ logger, inet: "eth0" });

    if (ethPing instanceof Error) {
      /**
       * ! Не работает канал связи ETH0
       */

      await removeEthRoute({ logger });
    } else {
      /**
       * * Работает канал связи ETH0
       */
      await addEthRoute({ logger });
    }

    await delay(signal, DELAY_MS);
  }
});

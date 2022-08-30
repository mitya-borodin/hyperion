import { delay } from "abort-controller-x";
import debug from "debug";

import { entrypoint } from "./infrastructure/entrypoint";
import { ifup } from "./infrastructure/external-resource-adapters/ifup";
import { ping } from "./infrastructure/external-resource-adapters/ping";
import {
  addEthRoute,
  removeEthRoute,
  resetRoutes,
} from "./infrastructure/external-resource-adapters/routes";
import { wbGsm } from "./infrastructure/external-resource-adapters/wb-gsm";

const logger = debug("BUTLER-WB-NET");

export const DELAY_MS = 5_000;

entrypoint(async ({ signal }) => {
  const wbGsmResult = await wbGsm({ signal });

  if (wbGsmResult instanceof Error) {
    return;
  }

  const ifupResult = await ifup();

  if (ifupResult instanceof Error) {
    return;
  }

  const resetRoutesResult = await resetRoutes();

  if (resetRoutesResult instanceof Error) {
    return;
  }

  while (true) {
    logger("Launch new round 🚀");

    const ethPing = await ping({ inet: "eth0" });

    if (ethPing instanceof Error) {
      /**
       * ! ETH0 НЕ работает
       */

      await removeEthRoute();
    } else {
      /**
       * * ETH0 Работает
       */

      await addEthRoute();
    }

    logger({ DELAY_MS }, "Wait next round 🌴");

    await delay(signal, DELAY_MS);
  }
});

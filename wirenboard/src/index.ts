import { delay } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";
import { ifup } from "./infrastructure/external-resource-adapters/ifup";
import { ping } from "./infrastructure/external-resource-adapters/ping";
import {
  addEthRoute,
  removeEthRoute,
  resetRoutes,
} from "./infrastructure/external-resource-adapters/routes";
import { wbGsm } from "./infrastructure/external-resource-adapters/wb-gsm";

export const DELAY_MS = 5_000;

entrypoint(async ({ signal, logger }) => {
  const wbGsmResult = await wbGsm({ logger: logger.child({ name: "WB_GSM" }), signal });

  if (wbGsmResult instanceof Error) {
    return;
  }

  const ifupResult = await ifup({ logger: logger.child({ name: "IF_UP" }) });

  if (ifupResult instanceof Error) {
    return;
  }

  const resetRoutesResult = await resetRoutes({ logger: logger.child({ name: "RESET_ROUTER" }) });

  if (resetRoutesResult instanceof Error) {
    return;
  }

  while (true) {
    logger.debug("Launch new round 🚀");

    const ethPing = await ping({ logger: logger.child({ name: "PING" }), inet: "eth0" });

    if (ethPing instanceof Error) {
      /**
       * ! ETH0 НЕ работает
       */

      await removeEthRoute({ logger: logger.child({ name: "REMOVE_ETH_ROUTE" }) });
    } else {
      /**
       * * ETH0 Работает
       */

      await addEthRoute({ logger: logger.child({ name: "ADD_ETH_ROUTE" }) });
    }

    logger.debug({ DELAY_MS }, "Wait next round 🌴");

    await delay(signal, DELAY_MS);
  }
});

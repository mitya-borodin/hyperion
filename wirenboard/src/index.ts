import fs from "fs";
import util from "util";

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

const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

export const DELAY_MS = 5_000;

entrypoint(async ({ signal, logger, logFilePath }) => {
  const wbGsmResult = await wbGsm({ logger, signal });

  if (wbGsmResult instanceof Error) {
    return;
  }

  const ifupResult = await ifup({ logger });

  if (ifupResult instanceof Error) {
    return;
  }

  const resetRoutesResult = await resetRoutes({ logger });

  if (resetRoutesResult instanceof Error) {
    return;
  }

  while (true) {
    console.log("Launch new round 🚀");

    const logStat = await stat(logFilePath);
    const logInMegaBytes = logStat.size / (1024 * 1024);

    if (logInMegaBytes > 5) {
      console.log("Clear log file 🚽");

      await writeFile(logFilePath, "", "utf8");
    }

    const ethPing = await ping({ logger, inet: "eth0" });

    if (ethPing instanceof Error) {
      /**
       * ! ETH0 НЕ работает
       */

      await removeEthRoute({ logger });
    } else {
      /**
       * * ETH0 Работает
       */

      await addEthRoute({ logger });
    }

    console.log("Wait next round 🌴", { DELAY_MS });

    await delay(signal, DELAY_MS);
  }
});

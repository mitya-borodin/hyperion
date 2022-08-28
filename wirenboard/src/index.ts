import { statSync, writeFileSync } from "fs";

import { delay } from "abort-controller-x";

import { entrypoint } from "./infrastructure/entrypoint";
import { ifup } from "./infrastructure/external-resource-adapters/ifup";
import { ping } from "./infrastructure/external-resource-adapters/ping";

entrypoint(async ({ signal, logger, logFilePath }) => {
  await ifup({ logger });

  while (true) {
    const logInBytes = statSync(logFilePath).size;
    const logInMegaBytes = logInBytes / (1024 * 1024);

    if (logInMegaBytes > 5) {
      writeFileSync(logFilePath, "", "utf8");
    }

    const ethPing = await ping({ logger, inet: "etc0" });

    if (ethPing instanceof Error) {
      const usbPing = await ping({ logger, inet: "usb0" });

      if (usbPing instanceof Error) {
        logger.error("Unable to connect to the Internet 🚨");
      } else {
        // ! Переключиться на USB_0
      }
    } else {
      // ! Переключиться на ETH_0
    }

    await delay(signal, 5_000);
  }
});

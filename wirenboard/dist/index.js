"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entrypoint_1 = require("./infrastructure/entrypoint");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal, logger, logFilePath }) => {
    /*   const ifupResult = await ifup({ logger });
    
      if (ifupResult instanceof Error) {
        return;
      } */
    const setRoutesResult = await (0, routes_1.setRoutes)({ logger });
    if (setRoutesResult instanceof Error) {
        return;
    }
    // while (true) {
    //   const logInBytes = statSync(logFilePath).size;
    //   const logInMegaBytes = logInBytes / (1024 * 1024);
    //   if (logInMegaBytes > 5) {
    //     writeFileSync(logFilePath, "", "utf8");
    //   }
    //   const [ethPing, usbPing] = await Promise.all([
    //     ping({ logger, inet: "eth0" }),
    //     ping({ logger, inet: "usb0" }),
    //   ]);
    //   /**
    //    * ! Оба канала связи НЕ работают
    //    */
    //   if (ethPing instanceof Error && usbPing instanceof Error) {
    //     logger.error("None of the internet access options work 🚨");
    //     await delay(signal, DELAY_MS);
    //     continue;
    //   }
    //   if (ethPing instanceof Error) {
    //     /**
    //      * ! Не работает канал связи ETH0
    //      */
    //     await removeEthRoute({ logger });
    //     await delay(signal, DELAY_MS);
    //     continue;
    //   } else {
    //     /**
    //      * * Работает канал связи ETH0
    //      */
    //     await setRoutes({ logger });
    //   }
    //   await delay(signal, DELAY_MS);
    // }
});

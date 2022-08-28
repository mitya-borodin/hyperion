"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal, logger, logFilePath }) => {
    const ifupResult = await (0, ifup_1.ifup)({ logger });
    if (ifupResult instanceof Error) {
        return;
    }
    const setRoutesResult = await (0, routes_1.setRoutes)({ logger });
    if (setRoutesResult instanceof Error) {
        return;
    }
    while (true) {
        const logInBytes = (0, fs_1.statSync)(logFilePath).size;
        const logInMegaBytes = logInBytes / (1024 * 1024);
        if (logInMegaBytes > 5) {
            (0, fs_1.writeFileSync)(logFilePath, "", "utf8");
        }
        const [ethPing, usbPing] = await Promise.all([
            (0, ping_1.ping)({ logger, inet: "eth0" }),
            (0, ping_1.ping)({ logger, inet: "usb0" }),
        ]);
        /**
         * ! Оба канала связи НЕ работают
         */
        if (ethPing instanceof Error && usbPing instanceof Error) {
            logger.error("None of the internet access options work 🚨");
            await (0, abort_controller_x_1.delay)(signal, DELAY_MS);
            continue;
        }
        if (ethPing instanceof Error) {
            /**
             * ! Не работает канал связи ETH0
             */
            await (0, routes_1.removeEthRoute)({ logger });
            await (0, abort_controller_x_1.delay)(signal, DELAY_MS);
            continue;
        }
        else {
            /**
             * * Работает канал связи ETH0
             */
            await (0, routes_1.setRoutes)({ logger });
        }
        await (0, abort_controller_x_1.delay)(signal, DELAY_MS);
    }
});

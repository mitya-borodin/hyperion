"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal, logger }) => {
    const ifupResult = await (0, ifup_1.ifup)({ logger });
    if (ifupResult instanceof Error) {
        return;
    }
    const resetRoutesResult = await (0, routes_1.resetRoutes)({ logger });
    if (resetRoutesResult instanceof Error) {
        return;
    }
    while (true) {
        const ethPing = await (0, ping_1.ping)({ logger, inet: "eth0" });
        if (ethPing instanceof Error) {
            /**
             * ! Не работает канал связи ETH0
             */
            await (0, routes_1.removeEthRoute)({ logger });
        }
        else {
            /**
             * * Работает канал связи ETH0
             */
            await (0, routes_1.addEthRoute)({ logger });
        }
        await (0, abort_controller_x_1.delay)(signal, DELAY_MS);
    }
});

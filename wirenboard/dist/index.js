"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELAY_MS = void 0;
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const wb_gsm_1 = require("./infrastructure/external-resource-adapters/wb-gsm");
exports.DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal, logger }) => {
    const wbGsmResult = await (0, wb_gsm_1.wbGsm)({ logger: logger.child({ name: "WB_GSM" }), signal });
    if (wbGsmResult instanceof Error) {
        return;
    }
    const ifupResult = await (0, ifup_1.ifup)({ logger: logger.child({ name: "IF_UP" }) });
    if (ifupResult instanceof Error) {
        return;
    }
    const resetRoutesResult = await (0, routes_1.resetRoutes)({ logger: logger.child({ name: "RESET_ROUTER" }) });
    if (resetRoutesResult instanceof Error) {
        return;
    }
    while (true) {
        logger.debug("Launch new round 🚀");
        const ethPing = await (0, ping_1.ping)({ logger: logger.child({ name: "PING" }), inet: "eth0" });
        if (ethPing instanceof Error) {
            /**
             * ! ETH0 НЕ работает
             */
            await (0, routes_1.removeEthRoute)({ logger: logger.child({ name: "REMOVE_ETH_ROUTE" }) });
        }
        else {
            /**
             * * ETH0 Работает
             */
            await (0, routes_1.addEthRoute)({ logger: logger.child({ name: "ADD_ETH_ROUTE" }) });
        }
        logger.debug({ DELAY_MS: exports.DELAY_MS }, "Wait next round 🌴");
        await (0, abort_controller_x_1.delay)(signal, exports.DELAY_MS);
    }
});

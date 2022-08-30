"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELAY_MS = void 0;
const tslib_1 = require("tslib");
const abort_controller_x_1 = require("abort-controller-x");
const debug_1 = tslib_1.__importDefault(require("debug"));
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const wb_gsm_1 = require("./infrastructure/external-resource-adapters/wb-gsm");
const logger = (0, debug_1.default)("BUTLER-WB-NET");
exports.DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal }) => {
    const wbGsmResult = await (0, wb_gsm_1.wbGsm)({ signal });
    if (wbGsmResult instanceof Error) {
        return;
    }
    const ifupResult = await (0, ifup_1.ifup)();
    if (ifupResult instanceof Error) {
        return;
    }
    const resetRoutesResult = await (0, routes_1.resetRoutes)();
    if (resetRoutesResult instanceof Error) {
        return;
    }
    while (true) {
        logger("Launch new round 🚀");
        const ethPing = await (0, ping_1.ping)({ inet: "eth0" });
        if (ethPing instanceof Error) {
            /**
             * ! ETH0 НЕ работает
             */
            await (0, routes_1.removeEthRoute)();
        }
        else {
            /**
             * * ETH0 Работает
             */
            await (0, routes_1.addEthRoute)();
        }
        logger({ DELAY_MS: exports.DELAY_MS }, "Wait next round 🌴");
        await (0, abort_controller_x_1.delay)(signal, exports.DELAY_MS);
    }
});

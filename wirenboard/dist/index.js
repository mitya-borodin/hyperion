"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELAY_MS = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const util_1 = tslib_1.__importDefault(require("util"));
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
const routes_1 = require("./infrastructure/external-resource-adapters/routes");
const wb_gsm_1 = require("./infrastructure/external-resource-adapters/wb-gsm");
const stat = util_1.default.promisify(fs_1.default.stat);
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
exports.DELAY_MS = 5000;
(0, entrypoint_1.entrypoint)(async ({ signal, logger, logFilePath }) => {
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
        const logStat = await stat(logFilePath);
        const logInMegaBytes = logStat.size / (1024 * 1024);
        if (logInMegaBytes > 5) {
            logger.info({ logInMegaBytes, logStat }, "Clear log file 🚽");
            await writeFile(logFilePath, "", "utf8");
        }
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

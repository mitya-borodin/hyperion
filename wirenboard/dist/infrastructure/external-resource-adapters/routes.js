"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEthRoute = exports.removeEthRoute = exports.resetRoutes = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const logger = (0, debug_1.default)("BUTLER-WB-ROUTE");
const resetRoutes = async () => {
    try {
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        logger("The reset routes ℹ️");
        logger(JSON.stringify({ currentRoutes }, null, 2));
        const result = [];
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            result.push(await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]));
        }
        if (currentRoutes.stdout.includes("default via 192.168.0.100 dev usb0")) {
            result.push(await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.0.100"]));
        }
        const addEth = await (0, execa_1.default)("ip", [
            "route",
            "add",
            "default",
            "via",
            "192.168.1.1",
            "metric",
            "1",
        ]);
        const addUsb = await (0, execa_1.default)("ip", [
            "route",
            "add",
            "default",
            "via",
            "192.168.0.100",
            "metric",
            "2",
        ]);
        logger("The routes was reset ✅");
        logger(JSON.stringify([...result, addEth, addUsb], null, 2));
    }
    catch (error) {
        logger("Reset routes was failed 🚨");
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("RESET_ROUTES_FAILED");
    }
};
exports.resetRoutes = resetRoutes;
const removeEthRoute = async () => {
    try {
        logger("Try change metric to 3 of eth0 ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0 metric 1")) {
            const delEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            const addEth = await (0, execa_1.default)("ip", [
                "route",
                "add",
                "default",
                "via",
                "192.168.1.1",
                "metric",
                "3",
            ]);
            logger("The eth0 route was downgraded to 3 ✅");
            logger(delEth.stdout);
            logger(delEth.stderr);
            logger(addEth.stdout);
            logger(addEth.stderr);
        }
    }
    catch (error) {
        logger("The eth0 route was not downgraded to 3 🚨");
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.removeEthRoute = removeEthRoute;
const addEthRoute = async () => {
    try {
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        logger("Try change metric to 1 of eth0 ℹ️");
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0 metric 3")) {
            const delEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            const addEth = await (0, execa_1.default)("ip", [
                "route",
                "add",
                "default",
                "via",
                "192.168.1.1",
                "metric",
                "1",
            ]);
            logger("The router eth0 was upgraded to 1 ✅");
            logger(delEth.stdout);
            logger(delEth.stderr);
            logger(addEth.stdout);
            logger(addEth.stderr);
        }
    }
    catch (error) {
        logger("The eth0 route was not upgraded to 1 🚨");
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.addEthRoute = addEthRoute;

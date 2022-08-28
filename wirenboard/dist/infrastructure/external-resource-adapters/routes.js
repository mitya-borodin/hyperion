"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEthRoute = exports.removeEthRoute = exports.resetRoutes = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const resetRoutes = async ({ logger }) => {
    try {
        logger.debug("The reset routes ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
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
            "0",
        ]);
        const addUsb = await (0, execa_1.default)("ip", [
            "route",
            "add",
            "default",
            "via",
            "192.168.0.100",
            "metric",
            "100",
        ]);
        logger.debug({
            results: [...result, addEth, addUsb],
        }, "The routes was reset ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Reset routes was failed 🚨");
        return new Error("RESET_ROUTES_FAILED");
    }
};
exports.resetRoutes = resetRoutes;
const removeEthRoute = async ({ logger }) => {
    try {
        logger.debug("Try change metric to 1000 of eth0 ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            const delEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            const addEth = await (0, execa_1.default)("ip", [
                "route",
                "add",
                "default",
                "via",
                "192.168.1.1",
                "metric",
                "1000",
            ]);
            logger.debug({ delEth, addEth }, "The eth0 route was updated ✅");
        }
    }
    catch (error) {
        logger.error({ err: error }, "The eth0 route was not updated 🚨");
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.removeEthRoute = removeEthRoute;
const addEthRoute = async ({ logger }) => {
    try {
        logger.debug("Try change metric to 0 of eth0 ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            const delEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            const addEth = await (0, execa_1.default)("ip", [
                "route",
                "add",
                "default",
                "via",
                "192.168.1.1",
                "metric",
                "0",
            ]);
            logger.debug({ delEth, addEth }, "The router eth0 was updated ✅");
        }
    }
    catch (error) {
        logger.error({ err: error }, "The eth0 route was not updated 🚨");
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.addEthRoute = addEthRoute;

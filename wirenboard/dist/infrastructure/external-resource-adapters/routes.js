"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEthRoute = exports.removeEthRoute = exports.resetRoutes = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const resetRoutes = async ({ logger }) => {
    try {
        logger.debug("The reset routes ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        logger.debug({ currentRoutes }, "Current routes is ℹ️");
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
        logger.debug("The remove eth0 route ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        logger.debug({ currentRoutes }, "Current routes ℹ️");
        if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            const result = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            logger.debug({ result }, "The eth0 route was removed ✅");
        }
    }
    catch (error) {
        logger.error({ err: error }, "The remove eth0 route was failed 🚨");
        return new Error("REMOVE_ETH0_ROUTE_FAILED");
    }
};
exports.removeEthRoute = removeEthRoute;
const addEthRoute = async ({ logger }) => {
    try {
        logger.debug("The add eth0 route ℹ️");
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
        logger.debug({ currentRoutes }, "Current routes ℹ️");
        if (!currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            const result = await (0, execa_1.default)("ip", [
                "route",
                "add",
                "default",
                "via",
                "192.168.1.1",
                "metric",
                "0",
            ]);
            logger.debug({ result }, "The router eth0 was added ✅");
        }
    }
    catch (error) {
        logger.error({ err: error }, "The add eth0 route was failed 🚨");
        return new Error("ADD_ETH0_ROUTE_FAILED");
    }
};
exports.addEthRoute = addEthRoute;

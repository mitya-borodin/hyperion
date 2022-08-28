"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEthRoute = exports.setRoutes = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const setRoutes = async ({ logger }) => {
    try {
        logger.debug("The update routes is running ℹ️");
        const routes = await (0, execa_1.default)("ip", ["route"]);
        const result = [];
        if (routes.stdout.includes("default via 192.168.1.1 dev eth0")) {
            const removeEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
            result.push(removeEth);
        }
        if (routes.stdout.includes("default via 192.168.0.100 dev usb0")) {
            const removeUsb = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.0.100"]);
            result.push(removeUsb);
        }
        logger.debug(routes, "Current routes is ℹ️");
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
        logger.debug([...result, addEth, addUsb], "The routes was updated ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Update routes was failed 🚨");
        return new Error("UPDATE_ROUTES_FAILED");
    }
};
exports.setRoutes = setRoutes;
const removeEthRoute = async ({ logger }) => {
    try {
        logger.debug("The update routes is running ℹ️");
        const removeUsb = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.0.100"]);
        const removeEth = await (0, execa_1.default)("ip", ["route", "del", "default", "via", "192.168.1.1"]);
        const addUsb = await (0, execa_1.default)("ip", ["route", "add", "default", "via", "192.168.0.100"]);
        logger.debug([removeUsb, removeEth, addUsb], "The routes was updated ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Update routes was failed 🚨");
        return new Error("UPDATE_ROUTES_FAILED");
    }
};
exports.removeEthRoute = removeEthRoute;

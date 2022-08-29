"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEthRoute = exports.removeEthRoute = exports.resetRoutes = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const resetRoutes = async ({ logger }) => {
    try {
        logger.info("The reset routes ℹ️");
        console.log("The reset routes ℹ️");
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
        logger.info({
            results: [...result, addEth, addUsb],
        }, "The routes was reset ✅");
        console.log("The routes was reset ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Reset routes was failed 🚨");
        console.error(error, "Reset routes was failed 🚨");
        return new Error("RESET_ROUTES_FAILED");
    }
};
exports.resetRoutes = resetRoutes;
const removeEthRoute = async ({ logger }) => {
    try {
        const message = "Try change metric to 3 of eth0 ℹ️";
        logger.info(message);
        console.log(message);
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
            const message = "The eth0 route was downgraded to 3 ✅";
            logger.info({ delEth, addEth }, message);
            console.log(message);
        }
    }
    catch (error) {
        const message = "The eth0 route was not downgraded to 3 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.removeEthRoute = removeEthRoute;
const addEthRoute = async ({ logger }) => {
    try {
        const message = "Try change metric to 1 of eth0 ℹ️";
        logger.info(message);
        console.log(message);
        const currentRoutes = await (0, execa_1.default)("ip", ["route"]);
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
            const message = "The router eth0 was upgraded to 1 ✅";
            logger.info({ delEth, addEth }, message);
            console.log(message);
        }
    }
    catch (error) {
        const message = "The eth0 route was not upgraded to 1 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("CHANGE_ETH0_ROUTE_FAILED");
    }
};
exports.addEthRoute = addEthRoute;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    console.log("Start ifup and wb-gsm restart_if_broken ℹ️");
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    try {
        logger.debug("Try lunch `wb-gsm restart_if_broken` ℹ️");
        const gsmResult = await (0, execa_1.default)("DEBUG=true", ["wb-gsm", "restart_if_broken"]);
        console.log(gsmResult.stdout);
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        logger.debug("Try lunch `ifup usb0`  ℹ️");
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        console.log(ifupResult.stdout);
        logger.debug({ gsmResult, ifupResult }, "The wb-gsm and ifup was successful lunched ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ifup failed 🚨");
        console.error(error, "Ifup failed 🚨");
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

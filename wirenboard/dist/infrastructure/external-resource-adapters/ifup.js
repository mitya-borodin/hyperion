"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    console.log("Start ifup and wb-gsm restart_if_broken ℹ️");
    console.log("Before the start, you need to wait 2 minutes ℹ️");
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));
    try {
        logger.debug("Try lunch `wb-gsm restart_if_broken` ℹ️");
        console.log("Try lunch `wb-gsm restart_if_broken` ℹ️");
        const gsmResult = await (0, execa_1.default)("wb-gsm", ["restart_if_broken"]);
        console.log(gsmResult.stdout);
        logger.debug("Try lunch `ifup usb0` ℹ️");
        console.log("Try lunch `ifup usb0` ℹ️");
        console.log("Before the start, you need to wait 10 second ℹ️");
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        console.log(ifupResult.stdout);
        logger.debug({ gsmResult, ifupResult }, "The wb-gsm and ifup was successful lunched ✅");
        console.log("The wb-gsm and ifup was successful lunched ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ifup failed 🚨");
        console.error(error, "Ifup failed 🚨");
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

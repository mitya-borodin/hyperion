"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    try {
        logger.info("Try lunch `ifup usb0`, before the start, you need to wait 10 second ℹ️");
        console.log("Try lunch `ifup usb0`, before the start, you need to wait 10 second ℹ️");
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        const message = "The wb-gsm and ifup was successful lunched ✅";
        console.log(ifupResult.stdout);
        logger.info({ ifupResult }, message);
        console.log(message);
    }
    catch (error) {
        const message = "Ifup failed 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    try {
        const message_0 = "Try lunch `ifup usb0` ℹ️";
        logger.info(message_0);
        console.log(message_0);
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        console.log(ifupResult.stdout);
        const message_1 = "The ifup was successful lunched ✅";
        logger.info({ ifupResult }, message_1);
        console.log(message_1);
    }
    catch (error) {
        const message = "Ifup failed 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

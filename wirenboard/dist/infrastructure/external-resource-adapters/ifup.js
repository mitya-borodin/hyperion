"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
    try {
        await (0, execa_1.default)("ifup", ["usb0"]);
        logger.debug("The ifup was successful ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ifup failed 🚨");
        return new Error("PING_FAILED");
    }
};
exports.ifup = ifup;

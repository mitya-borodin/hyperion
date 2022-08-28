"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    try {
        logger.debug("Try lunch `wb-gsm restart_if_broken` ℹ️");
        const gsmResult = await (0, execa_1.default)("wb-gsm", ["restart_if_broken"]);
        logger.debug("Try lunch `ifup usb0`  ℹ️");
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        logger.debug({ gsmResult, ifupResult }, "The wb-gsm amd ifup was successful lunched ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ifup failed 🚨");
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

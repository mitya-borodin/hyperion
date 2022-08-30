"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const logger = (0, debug_1.default)("BUTLER-WB-IFUP");
const ifup = async () => {
    try {
        logger("Try lunch `ifup usb0` ℹ️");
        const ifupResult = await (0, execa_1.default)("ifup", ["usb0"]);
        logger("The ifup was successful lunched ✅");
        logger(JSON.stringify({ ifupResult }, null, 2));
    }
    catch (error) {
        logger("Ifup failed 🚨");
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

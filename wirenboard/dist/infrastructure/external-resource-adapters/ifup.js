"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifup = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ifup = async ({ logger }) => {
    logger.debug("Waiting for the `ifup usb0` command to run has started ℹ️");
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    try {
        logger.debug("The `ifup usb0` command is running ℹ️");
        const subprocess = (0, execa_1.default)("ifup", ["usb0"]);
        subprocess.stdout?.pipe(process.stdout);
        logger.debug("The ifup was successful ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ifup failed 🚨");
        return new Error("IFUP_FAILED");
    }
};
exports.ifup = ifup;

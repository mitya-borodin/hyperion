"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ping = async ({ logger, inet = "etc0" }) => {
    try {
        await Promise.all([
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "ya.ru"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "77.88.8.8"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "77.88.8.1"]),
        ]);
        logger.debug({ inet }, "The ping was successful ✅");
    }
    catch (error) {
        logger.error({ err: error }, "Ping failed 🚨");
        return new Error("PING_FAILED");
    }
};
exports.ping = ping;

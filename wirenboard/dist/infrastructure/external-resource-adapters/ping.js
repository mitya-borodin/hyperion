"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const ping = async ({ logger, inet = "eth0" }) => {
    try {
        console.log("Start ping 🛫");
        await Promise.all([
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "ya.ru"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "77.88.8.8"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "77.88.8.1"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "208.67.222.222"]),
            (0, execa_1.default)("ping", ["-c", "5", "-I", inet, "208.67.220.220"]),
        ]);
        const message = "The ping was successful ✅ 🛬";
        logger.info({ inet }, message);
        console.log(message);
    }
    catch (error) {
        const message = "Ping failed 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("PING_FAILED");
    }
};
exports.ping = ping;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const logger = (0, debug_1.default)("BUTLER-WB-PING");
const ping = async ({ inet = "eth0" }) => {
    try {
        logger(`Start ping -I ${inet} 🛫`);
        await Promise.all([
            (0, execa_1.default)("ping", ["-c", "2", "-I", inet, "77.88.8.8"]),
            (0, execa_1.default)("ping", ["-c", "2", "-I", inet, "77.88.8.1"]),
        ]);
        logger(`The ping -I ${inet} was successful ✅ 🛬`);
    }
    catch (error) {
        logger(`Ping -I ${inet} failed 🚨`);
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("PING_FAILED");
    }
};
exports.ping = ping;

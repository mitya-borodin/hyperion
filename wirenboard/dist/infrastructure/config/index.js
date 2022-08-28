"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.Config = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const rootDir = path_1.default.resolve(__dirname, "../../..");
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config({ path: path_1.default.resolve(rootDir, ".env"), debug: true });
}
class Config {
    constructor() {
        this.appName = process.env.APP_NAME ?? os_1.default.hostname();
        this.production = process.env.NODE_ENV === "production";
        this.log = {
            level: this.toLogLevel(process.env.LOG_LEVEL),
        };
        this.gracefullyShutdownMs = this.toInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? "", 5000);
        this.mosquitto = {
            host: process.env.MOSQUITTO_HOST ?? "192.168.1.75",
            port: this.toInt(process.env.MOSQUITTO_PORT ?? "", 1883),
            protocol: this.toMosquittoProtocol(process.env.MOSQUITTO_PORT ?? "mqtt"),
            username: process.env.MOSQUITTO_USERNAME ?? "",
            password: process.env.MOSQUITTO_PASSWORD ?? "",
        };
    }
    toInt(mayBeNumber, defaultValue) {
        const number = parseInt(mayBeNumber);
        if (Number.isSafeInteger(number)) {
            return number;
        }
        return defaultValue;
    }
    toLogLevel(level) {
        if (level === "fatal") {
            return "fatal";
        }
        if (level === "error") {
            return "error";
        }
        if (level === "warn") {
            return "warn";
        }
        if (level === "info") {
            return "info";
        }
        if (level === "debug") {
            return "debug";
        }
        if (level === "trace") {
            return "trace";
        }
        return "info";
    }
    toMosquittoProtocol(protocol) {
        if (protocol === "wss") {
            return "wss";
        }
        if (protocol === "ws") {
            return "ws";
        }
        if (protocol === "mqtt") {
            return "mqtt";
        }
        if (protocol === "mqtts") {
            return "mqtts";
        }
        if (protocol === "tcp") {
            return "tcp";
        }
        if (protocol === "ssl") {
            return "ssl";
        }
        if (protocol === "wx") {
            return "wx";
        }
        if (protocol === "wxs") {
            return "wxs";
        }
        return "mqtt";
    }
}
exports.Config = Config;
exports.config = new Config();

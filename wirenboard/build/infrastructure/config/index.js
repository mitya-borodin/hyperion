"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.Config = void 0;
/* eslint-disable unicorn/prefer-module */
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const rootDirection = node_path_1.default.resolve(__dirname, '../../..');
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config({ path: node_path_1.default.resolve(rootDirection, '.env'), debug: true });
}
class Config {
    appName;
    production;
    gracefullyShutdownMs;
    mosquitto;
    constructor() {
        this.appName = process.env.APP_NAME ?? node_os_1.default.hostname();
        this.production = process.env.NODE_ENV === 'production';
        this.gracefullyShutdownMs = this.toInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? '', 5000);
        this.mosquitto = {
            host: process.env.MOSQUITTO_HOST ?? '192.168.1.75',
            port: this.toInt(process.env.MOSQUITTO_PORT ?? '', 1883),
            protocol: this.toMosquittoProtocol(process.env.MOSQUITTO_PORT ?? 'mqtt'),
            username: process.env.MOSQUITTO_USERNAME ?? '',
            password: process.env.MOSQUITTO_PASSWORD ?? '',
        };
    }
    toInt(mayBeNumber, defaultValue) {
        const number = Number.parseInt(mayBeNumber);
        if (Number.isSafeInteger(number)) {
            return number;
        }
        return defaultValue;
    }
    toMosquittoProtocol(protocol) {
        if (protocol === 'wss') {
            return 'wss';
        }
        if (protocol === 'ws') {
            return 'ws';
        }
        if (protocol === 'mqtt') {
            return 'mqtt';
        }
        if (protocol === 'mqtts') {
            return 'mqtts';
        }
        if (protocol === 'tcp') {
            return 'tcp';
        }
        if (protocol === 'ssl') {
            return 'ssl';
        }
        if (protocol === 'wx') {
            return 'wx';
        }
        if (protocol === 'wxs') {
            return 'wxs';
        }
        return 'mqtt';
    }
}
exports.Config = Config;
exports.config = new Config();

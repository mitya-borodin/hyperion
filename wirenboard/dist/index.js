"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
const ifup_1 = require("./infrastructure/external-resource-adapters/ifup");
const ping_1 = require("./infrastructure/external-resource-adapters/ping");
(0, entrypoint_1.entrypoint)(async ({ signal, logger, logFilePath }) => {
    await (0, ifup_1.ifup)({ logger });
    while (true) {
        const logInBytes = (0, fs_1.statSync)(logFilePath).size;
        const logInMegaBytes = logInBytes / (1024 * 1024);
        if (logInMegaBytes > 5) {
            (0, fs_1.writeFileSync)(logFilePath, "", "utf8");
        }
        const ethPing = await (0, ping_1.ping)({ logger, inet: "etc0" });
        if (ethPing instanceof Error) {
            const usbPing = await (0, ping_1.ping)({ logger, inet: "usb0" });
            if (usbPing instanceof Error) {
                logger.error("Unable to connect to the Internet 🚨");
            }
            else {
                // ! Переключиться на USB_0
            }
        }
        else {
            // ! Переключиться на ETH_0
        }
        await (0, abort_controller_x_1.delay)(signal, 5000);
    }
});

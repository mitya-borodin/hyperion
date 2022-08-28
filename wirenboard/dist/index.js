"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
(0, entrypoint_1.entrypoint)(async ({ signal, logger, logFilePath, defer, fork }) => {
    while (true) {
        const logInBytes = (0, fs_1.statSync)(logFilePath).size;
        const logInMegaBytes = logInBytes / (1024 * 1024);
        if (logInMegaBytes > 5) {
            (0, fs_1.writeFileSync)(logFilePath, "", "utf8");
        }
        logger.info("PING");
        await (0, abort_controller_x_1.delay)(signal, 5000);
    }
});

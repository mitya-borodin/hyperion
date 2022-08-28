"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abort_controller_x_1 = require("abort-controller-x");
const entrypoint_1 = require("./infrastructure/entrypoint");
(0, entrypoint_1.entrypoint)(async ({ signal, logger, defer, fork }) => {
    while (true) {
        logger.debug("ping");
        await (0, abort_controller_x_1.delay)(signal, 5000);
    }
});

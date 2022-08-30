"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wbGsm = void 0;
const tslib_1 = require("tslib");
const node_child_process_1 = require("node:child_process");
const abort_controller_x_1 = require("abort-controller-x");
const debug_1 = tslib_1.__importDefault(require("debug"));
const __1 = require("../..");
const logger = (0, debug_1.default)("BUTLER-WB-GSM");
const wbGsm = async ({ signal }) => {
    logger("Before try to first lunch `wb-gsm restart_if_broken` need to wait 1 minute ℹ️");
    await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));
    try {
        while (true) {
            logger("Try to lunch `wb-gsm restart_if_broken` ℹ️");
            const command = "DEBUG=true wb-gsm restart_if_broken";
            const childProcess = (0, node_child_process_1.exec)(command, { signal }, (err, stdout, stderr) => {
                if (err) {
                    logger(command);
                    logger(err.message);
                    return;
                }
                logger(command);
                logger(stdout);
                logger(stderr);
            });
            childProcess.on("error", (error) => {
                logger(error.message);
            });
            childProcess.once("close", (code) => {
                logger(`The wb-gsm restart_if_broken process was closed`);
                logger(JSON.stringify({ code }, null, 2));
            });
            const timer = setTimeout(() => {
                logger("The wb-gsm restart_if_broken process does not finish for more than 30 seconds," +
                    " the process will be forcibly stopped and restarted 🚨");
                childProcess.kill();
            }, 30 * 1000);
            const isExit = await new Promise((resolve) => {
                childProcess.once("exit", (code) => {
                    logger(`wb-gsm restart_if_broken process exited with code ${code}`);
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve(true);
                    }
                    else {
                        logger("The GSM launch failed 🚨");
                        resolve(false);
                    }
                });
            });
            if (isExit) {
                logger("The GSM was successful lunched ✅");
                return;
            }
            await (0, abort_controller_x_1.delay)(signal, __1.DELAY_MS);
        }
    }
    catch (error) {
        logger("The GSM launch failed 🚨");
        if (error instanceof Error) {
            logger(error.message);
        }
        return new Error("WB_GSM_FAILED");
    }
};
exports.wbGsm = wbGsm;

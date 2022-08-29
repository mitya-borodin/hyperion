"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wbGsm = void 0;
const node_child_process_1 = require("node:child_process");
const abort_controller_x_1 = require("abort-controller-x");
const __1 = require("../..");
const wbGsm = async ({ logger, signal }) => {
    logger.info("Before try to first lunch `wb-gsm restart_if_broken` need to wait 3 minute ℹ️");
    await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000));
    try {
        while (true) {
            logger.debug("Try to lunch `wb-gsm restart_if_broken` ℹ️");
            const command = "DEBUG=true wb-gsm restart_if_broken";
            const childProcess = (0, node_child_process_1.exec)(command, { signal }, (err, stdout, stderr) => {
                if (err) {
                    logger.error({ err }, command);
                    return;
                }
                logger.debug({ stdout, stderr }, command);
            });
            childProcess.on("error", (error) => {
                logger.error({ err: error });
            });
            childProcess.once("close", (code) => {
                logger.debug({ code }, `The wb-gsm restart_if_broken process was closed`);
            });
            const timer = setTimeout(() => {
                logger.debug("The wb-gsm restart_if_broken process does not finish for more than 30 seconds," +
                    " the process will be forcibly stopped and restarted 🚨");
                childProcess.kill();
            }, 30 * 1000);
            const isExit = await new Promise((resolve) => {
                childProcess.once("exit", (code) => {
                    logger.debug(`wb-gsm restart_if_broken process exited with code ${code}`);
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve(true);
                    }
                    else {
                        logger.info("The GSM launch failed 🚨");
                        resolve(false);
                    }
                });
            });
            if (isExit) {
                logger.info("The GSM was successful lunched ✅");
                return;
            }
            await (0, abort_controller_x_1.delay)(signal, __1.DELAY_MS);
        }
    }
    catch (error) {
        logger.error({ err: error }, "The GSM launch failed 🚨");
        return new Error("WB_GSM_FAILED");
    }
};
exports.wbGsm = wbGsm;

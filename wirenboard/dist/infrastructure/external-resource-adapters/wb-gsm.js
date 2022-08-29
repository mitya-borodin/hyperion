"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wbGsm = void 0;
const node_child_process_1 = require("node:child_process");
const abort_controller_x_1 = require("abort-controller-x");
const __1 = require("../..");
const wbGsm = async ({ logger, signal }) => {
    try {
        while (true) {
            const message = "Try to lunch `wb-gsm restart_if_broken` ℹ️";
            logger.info(message);
            console.log(message);
            const childProcess = (0, node_child_process_1.exec)("DEBUG=true wb-gsm restart_if_broken", (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (stderr) {
                    logger.error(stderr);
                    console.error(stderr);
                }
                logger.info(stdout);
                console.log(stdout);
            });
            childProcess.on("error", (error) => {
                logger.error({ err: error });
                console.error(error);
            });
            childProcess.once("close", (code) => {
                const message = `The wb-gsm restart_if_broken process was closed with code: ${code}`;
                logger.info({ code }, message);
                console.log(message);
            });
            const timer = setTimeout(() => {
                const message = "The wb-gsm restart_if_broken process does not finish for more than 2 minutes, the process will be forcibly stopped and restarted 🚨";
                logger.info(message);
                console.log(message);
                childProcess.kill("SIGTERM");
            }, 2 * 60 * 1000);
            const isExit = await new Promise((resolve) => {
                childProcess.once("exit", (code) => {
                    const message = `wb-gsm restart_if_broken process exited with code ${code}`;
                    logger.info(message);
                    console.log(message);
                    if (code === 0) {
                        clearTimeout(timer);
                        resolve(true);
                    }
                    else {
                        const message = "The GSM launch failed 🚨";
                        logger.info(message);
                        console.log(message);
                        resolve(false);
                    }
                });
            });
            if (isExit) {
                const message = "The GSM was successful lunched ✅";
                logger.info(message);
                console.log(message);
                return;
            }
            await (0, abort_controller_x_1.delay)(signal, __1.DELAY_MS);
        }
    }
    catch (error) {
        const message = "The GSM launch failed 🚨";
        logger.error({ err: error }, message);
        console.error(error, message);
        return new Error("WB_GSM_FAILED");
    }
};
exports.wbGsm = wbGsm;

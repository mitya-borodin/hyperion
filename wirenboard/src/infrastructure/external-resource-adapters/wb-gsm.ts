import { exec } from "node:child_process";

import { delay } from "abort-controller-x";
import { AbortSignal } from "node-abort-controller";
import { Logger } from "pino";

import { DELAY_MS } from "../..";

type WbGsmParams = {
  logger: Logger;
  signal: AbortSignal;
};

export const wbGsm = async ({ logger, signal }: WbGsmParams) => {
  logger.info("Before try to first lunch `wb-gsm restart_if_broken` need to wait 1 minute ℹ️");

  await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));

  try {
    while (true) {
      logger.debug("Try to lunch `wb-gsm restart_if_broken` ℹ️");

      const command = "DEBUG=true wb-gsm restart_if_broken";

      const childProcess = exec(command, { signal }, (err, stdout, stderr) => {
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
        logger.debug(
          "The wb-gsm restart_if_broken process does not finish for more than 30 seconds," +
            " the process will be forcibly stopped and restarted 🚨",
        );

        childProcess.kill();
      }, 30 * 1000);

      const isExit = await new Promise((resolve) => {
        childProcess.once("exit", (code) => {
          logger.debug(`wb-gsm restart_if_broken process exited with code ${code}`);

          if (code === 0) {
            clearTimeout(timer);
            resolve(true);
          } else {
            logger.info("The GSM launch failed 🚨");

            resolve(false);
          }
        });
      });

      if (isExit) {
        logger.info("The GSM was successful lunched ✅");
        return;
      }

      await delay(signal, DELAY_MS);
    }
  } catch (error) {
    logger.error({ err: error }, "The GSM launch failed 🚨");

    return new Error("WB_GSM_FAILED");
  }
};

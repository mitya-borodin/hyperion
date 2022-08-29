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
  const message = "Start `wb-gsm restart_if_broken` ℹ️";

  logger.info(message);
  console.log(message);

  try {
    while (true) {
      const message = "Try to lunch `wb-gsm restart_if_broken` ℹ️";

      logger.info(message);
      console.log(message);

      const childProcess = exec("DEBUG=true wb-gsm restart_if_broken", (err, stdout, stderr) => {
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

      const timer = setTimeout(() => {
        const message =
          "The wb-gsm restart_if_broken process does not finish for more than 2 minutes, the process will be forcibly stopped and restarted 🚨";

        logger.info(message);
        console.log(message);

        childProcess.kill("SIGTERM");
      }, 2 * 60 * 1000);

      const isExit = await new Promise((resolve) => {
        childProcess.once("exit", (code) => {
          const message = `wb-gsm restart_if_broken process exited with code ${code}`;

          console.log(message);
          logger.info(message);

          if (code === 0) {
            clearTimeout(timer);
            resolve(true);
          } else {
            const message = "The GSM launch failed 🚨";

            console.log(message);
            logger.info(message);

            resolve(false);
          }
        });
      });

      if (isExit) {
        const message = "The GSM was successful lunched ✅";

        console.log(message);
        logger.info(message);
        return;
      }

      await delay(signal, DELAY_MS);
    }
  } catch (error) {
    const message = "The GSM launch failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("WB_GSM_FAILED");
  }
};

import { exec } from "node:child_process";

import { Logger } from "pino";

type WbGsmParams = {
  logger: Logger;
};

export const wbGsm = async ({ logger }: WbGsmParams) => {
  const message = "Start wb-gsm restart_if_broken, Before the start, you need to wait 2 minutes ℹ️";

  logger.info(message);
  console.log(message);

  await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

  try {
    const message = "Try lunch `wb-gsm restart_if_broken` ℹ️";

    logger.info(message);
    console.log(message);

    const childProcess = exec("DEBUG=true wb-gsm restart_if_broken", (err, stdout, stderr) => {
      if (err) {
        console.error(err);

        return;
      }

      logger.info(stdout);
      console.log(stdout);
      console.error(stderr);
    });

    const timer = setTimeout(() => {
      const message =
        "The wb-gsm restart_if_broken process does not finish for more than 5 minutes, the process will be forcibly stopped and restarted 🚨";

      logger.info(message);
      console.log(message);

      childProcess.kill("SIGTERM");

      setTimeout(() => wbGsm({ logger }), 10 * 1000);
    }, 5 * 60 * 1000);

    childProcess.once("exit", (code) => {
      const message = `wb-gsm restart_if_broken process exited with code ${code}`;

      console.log(message);
      logger.info(message);

      if (code === 0) {
        clearTimeout(timer);

        const message = "The GSM was successful lunched ✅";

        console.log(message);
        logger.info(message);
      } else {
        const message = "The GSM launch failed 🚨";

        console.log(message);
        logger.info(message);

        setTimeout(() => wbGsm({ logger }), 10 * 1000);
      }
    });
  } catch (error) {
    const message = "The GSM launch failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("WB_GSM_FAILED");
  }
};

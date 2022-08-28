import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  logger.debug("Waiting for the `ifup usb0` command to run has started ℹ️");

  await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

  try {
    logger.debug("The `ifup usb0` command is running ℹ️");

    const result = await execa("ifup", ["usb0"]);

    logger.debug(result, "The ifup was successful ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

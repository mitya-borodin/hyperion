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

    const subprocess = execa("ifup", ["usb0"]);

    if (subprocess.stdout === null) {
      throw new Error("BAG_STDOUT");
    }

    subprocess.stdout.pipe(process.stdout);

    logger.debug("The ifup was successful ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

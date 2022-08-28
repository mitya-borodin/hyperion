import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  await new Promise((resolve) => setTimeout(resolve, 30 * 1000));

  try {
    await execa("ifup", ["usb0"]);

    logger.debug("The ifup was successful ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    return new Error("PING_FAILED");
  }
};

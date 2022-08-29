import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  try {
    logger.debug("Try lunch `ifup usb0` ℹ️");

    const ifupResult = await execa("ifup", ["usb0"]);

    logger.info({ ifupResult }, "The ifup was successful lunched ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

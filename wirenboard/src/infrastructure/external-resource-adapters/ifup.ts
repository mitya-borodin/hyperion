import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

  try {
    logger.debug("Try lunch `wb-gsm restart_if_broken` ℹ️");

    const gsmResult = await execa("wb-gsm", ["restart_if_broken"]);

    logger.debug("Try lunch `ifup usb0`  ℹ️");

    const ifupResult = await execa("ifup", ["usb0"]);

    logger.debug({ gsmResult, ifupResult }, "The wb-gsm amd ifup was successful lunched ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

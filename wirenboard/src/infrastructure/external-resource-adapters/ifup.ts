import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  try {
    logger.info("Try lunch `ifup usb0` ℹ️");
    console.log("Try lunch `ifup usb0`ℹ️");

    const ifupResult = await execa("ifup", ["usb0"]);

    console.log(ifupResult.stdout);

    const message = "The wb-gsm and ifup was successful lunched ✅";

    logger.info({ ifupResult }, message);
    console.log(message);
  } catch (error) {
    const message = "Ifup failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("IFUP_FAILED");
  }
};

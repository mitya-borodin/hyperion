import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  try {
    logger.info("Try lunch `ifup usb0`, before the start, you need to wait 10 second ℹ️");
    console.log("Try lunch `ifup usb0`, before the start, you need to wait 10 second ℹ️");

    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    const ifupResult = await execa("ifup", ["usb0"]);

    const message = "The wb-gsm and ifup was successful lunched ✅";

    console.log(ifupResult.stdout);
    logger.info({ ifupResult }, message);
    console.log(message);
  } catch (error) {
    const message = "Ifup failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("IFUP_FAILED");
  }
};

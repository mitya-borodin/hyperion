import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  try {
    const message_0 = "Try lunch `ifup usb0` ℹ️";

    logger.info(message_0);
    console.log(message_0);

    const ifupResult = await execa("ifup", ["usb0"]);

    console.log(ifupResult.stdout);

    const message_1 = "The ifup was successful lunched ✅";

    logger.info({ ifupResult }, message_1);
    console.log(message_1);
  } catch (error) {
    const message = "Ifup failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("IFUP_FAILED");
  }
};

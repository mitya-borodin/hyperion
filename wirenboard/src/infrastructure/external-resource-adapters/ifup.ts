import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  console.log("Start ifup and wb-gsm restart_if_broken ℹ️");

  await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

  try {
    logger.debug("Try lunch `wb-gsm restart_if_broken` ℹ️");

    const gsmResult = await execa("DEBUG=true", ["wb-gsm", "restart_if_broken"]);

    console.log(gsmResult.stdout);

    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    logger.debug("Try lunch `ifup usb0`  ℹ️");

    const ifupResult = await execa("ifup", ["usb0"]);

    console.log(ifupResult.stdout);

    logger.debug({ gsmResult, ifupResult }, "The wb-gsm and ifup was successful lunched ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    console.error(error, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

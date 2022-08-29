import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const ifup = async ({ logger }: PingParams) => {
  console.log("Start ifup and wb-gsm restart_if_broken ℹ️");
  console.log("Before the start, you need to wait 2 minutes ℹ️");

  await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));

  try {
    logger.info("Try lunch `wb-gsm restart_if_broken` ℹ️");

    console.log("Try lunch `wb-gsm restart_if_broken` ℹ️");

    const gsmResult = await execa("wb-gsm", ["restart_if_broken"]);

    console.log(gsmResult.stdout);

    logger.info("Try lunch `ifup usb0` ℹ️");

    console.log("Try lunch `ifup usb0` ℹ️");

    console.log("Before the start, you need to wait 10 second ℹ️");

    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    const ifupResult = await execa("ifup", ["usb0"]);

    console.log(ifupResult.stdout);

    logger.info({ gsmResult, ifupResult }, "The wb-gsm and ifup was successful lunched ✅");

    console.log("The wb-gsm and ifup was successful lunched ✅");
  } catch (error) {
    logger.error({ err: error }, "Ifup failed 🚨");

    console.error(error, "Ifup failed 🚨");

    return new Error("IFUP_FAILED");
  }
};

import debug from "debug";
import execa from "execa";

const logger = debug("BUTLER-WB-IFUP");

export const ifup = async () => {
  try {
    logger("Try lunch `ifup usb0` ℹ️");

    const ifupResult = await execa("ifup", ["usb0"]);

    logger("The ifup was successful lunched ✅");
    logger(JSON.stringify({ ifupResult }, null, 2));
  } catch (error) {
    logger("Ifup failed 🚨");

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error("IFUP_FAILED");
  }
};

import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  inet: "etc0" | "usb0";
  logger: Logger;
};

export const ping = async ({ logger, inet = "etc0" }: PingParams) => {
  try {
    await Promise.all([
      execa("ping", ["-c", "5", "-I", inet, "ya.ru"]),
      execa("ping", ["-c", "5", "-I", inet, "77.88.8.8"]),
      execa("ping", ["-c", "5", "-I", inet, "77.88.8.1"]),
    ]);

    logger.debug({ inet }, "The ping was successful ✅");
  } catch (error) {
    logger.error({ err: error }, "Ping failed 🚨");

    return new Error("PING_FAILED");
  }
};

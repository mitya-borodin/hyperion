import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  inet: "eth0" | "usb0";
  logger: Logger;
};

export const ping = async ({ logger, inet = "eth0" }: PingParams) => {
  try {
    console.log("Start ping 🛫");

    await Promise.all([
      execa("ping", ["-c", "5", "-I", inet, "ya.ru"]),
      execa("ping", ["-c", "5", "-I", inet, "77.88.8.8"]),
      execa("ping", ["-c", "5", "-I", inet, "77.88.8.1"]),
      execa("ping", ["-c", "5", "-I", inet, "208.67.222.222"]),
      execa("ping", ["-c", "5", "-I", inet, "208.67.220.220"]),
    ]);

    const message = "The ping was successful ✅ 🛬";

    logger.info({ inet }, message);
    console.log(message);
  } catch (error) {
    const message = "Ping failed 🚨";

    logger.error({ err: error }, message);
    console.error(error, message);

    return new Error("PING_FAILED");
  }
};

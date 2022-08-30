import debug from "debug";
import execa from "execa";

const logger = debug("BUTLER-WB-PING");

type PingParams = {
  inet: "eth0" | "usb0";
};

export const ping = async ({ inet = "eth0" }: PingParams) => {
  try {
    logger(`Start ping -I ${inet} 🛫`);

    await Promise.all([
      execa("ping", ["-c", "2", "-I", inet, "77.88.8.8"]),
      execa("ping", ["-c", "2", "-I", inet, "77.88.8.1"]),
    ]);

    logger(`The ping -I ${inet} was successful ✅ 🛬`);
  } catch (error) {
    logger(`Ping -I ${inet} failed 🚨`);

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error("PING_FAILED");
  }
};

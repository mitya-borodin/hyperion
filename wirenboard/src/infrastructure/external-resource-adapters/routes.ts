import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const resetRoutes = async ({ logger }: PingParams) => {
  try {
    logger.debug("The reset routes ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    const result = [];

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      result.push(await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]));
    }

    if (currentRoutes.stdout.includes("default via 192.168.0.100 dev usb0")) {
      result.push(await execa("ip", ["route", "del", "default", "via", "192.168.0.100"]));
    }

    const addEth = await execa("ip", [
      "route",
      "add",
      "default",
      "via",
      "192.168.1.1",
      "metric",
      "0",
    ]);

    const addUsb = await execa("ip", [
      "route",
      "add",
      "default",
      "via",
      "192.168.0.100",
      "metric",
      "100",
    ]);

    logger.debug(
      {
        results: [...result, addEth, addUsb],
      },
      "The routes was reset ✅",
    );
  } catch (error) {
    logger.error({ err: error }, "Reset routes was failed 🚨");

    return new Error("RESET_ROUTES_FAILED");
  }
};

export const removeEthRoute = async ({ logger }: PingParams) => {
  try {
    logger.debug("Try change metric to 1000 of eth0 ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      const result = await execa("ip", [
        "route",
        "change",
        "default",
        "via",
        "192.168.1.1",
        "metric",
        "1000",
      ]);

      logger.debug({ result }, "The eth0 route was updated ✅");
    }
  } catch (error) {
    logger.error({ err: error }, "The eth0 route was not updated 🚨");

    return new Error("CHANGE_ETH0_ROUTE_FAILED");
  }
};

export const addEthRoute = async ({ logger }: PingParams) => {
  try {
    logger.debug("Try change metric to 0 of eth0 ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    if (!currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      const result = await execa("ip", [
        "route",
        "change",
        "default",
        "via",
        "192.168.1.1",
        "metric",
        "0",
      ]);

      logger.debug({ result }, "The router eth0 was updated ✅");
    }
  } catch (error) {
    logger.error({ err: error }, "The eth0 route was not updated 🚨");

    return new Error("CHANGE_ETH0_ROUTE_FAILED");
  }
};

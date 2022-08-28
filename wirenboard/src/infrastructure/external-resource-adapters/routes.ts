import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const resetRoutes = async ({ logger }: PingParams) => {
  try {
    logger.debug("The reset routes ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    logger.debug({ currentRoutes }, "Current routes is ℹ️");

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
    logger.debug("The remove eth0 route ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    logger.debug({ currentRoutes }, "Current routes ℹ️");

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      const result = await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]);

      logger.debug({ result }, "The eth0 route was removed ✅");
    }
  } catch (error) {
    logger.error({ err: error }, "The remove eth0 route was failed 🚨");

    return new Error("REMOVE_ETH0_ROUTE_FAILED");
  }
};

export const addEthRoute = async ({ logger }: PingParams) => {
  try {
    logger.debug("The add eth0 route ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    logger.debug({ currentRoutes }, "Current routes ℹ️");

    if (!currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      const result = await execa("ip", [
        "route",
        "add",
        "default",
        "via",
        "192.168.1.1",
        "metric",
        "0",
      ]);
      logger.debug({ result }, "The router eth0 was added ✅");
    }
  } catch (error) {
    logger.error({ err: error }, "The add eth0 route was failed 🚨");

    return new Error("ADD_ETH0_ROUTE_FAILED");
  }
};

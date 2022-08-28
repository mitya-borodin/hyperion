import execa from "execa";
import { Logger } from "pino";

type PingParams = {
  logger: Logger;
};

export const setRoutes = async ({ logger }: PingParams) => {
  try {
    logger.debug("The update routes is running ℹ️");

    const routes = await execa("ip", ["route"]);

    logger.debug(routes, "Current routes is ℹ️");

    /*     const removeUsb = await execa("ip", ["route", "del", "default", "via", "192.168.0.100"]);
    const removeEth = await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]);
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

    logger.debug([removeUsb, removeEth, addEth, addUsb], "The routes was updated ✅"); */
  } catch (error) {
    logger.error({ err: error }, "Update routes was failed 🚨");

    return new Error("UPDATE_ROUTES_FAILED");
  }
};

export const removeEthRoute = async ({ logger }: PingParams) => {
  try {
    logger.debug("The update routes is running ℹ️");

    const removeUsb = await execa("ip", ["route", "del", "default", "via", "192.168.0.100"]);
    const removeEth = await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]);
    const addUsb = await execa("ip", ["route", "add", "default", "via", "192.168.0.100"]);

    logger.debug([removeUsb, removeEth, addUsb], "The routes was updated ✅");
  } catch (error) {
    logger.error({ err: error }, "Update routes was failed 🚨");

    return new Error("UPDATE_ROUTES_FAILED");
  }
};

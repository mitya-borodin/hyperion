import debug from "debug";
import execa from "execa";

const logger = debug("BUTLER-WB-ROUTE");

export const resetRoutes = async () => {
  try {
    const currentRoutes = await execa("ip", ["route"]);

    logger("The reset routes ℹ️");
    logger(currentRoutes.stdout);
    logger(currentRoutes.stderr);

    const result = [];

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0")) {
      const { stdout, stderr } = await execa("ip", [
        "route",
        "del",
        "default",
        "via",
        "192.168.1.1",
      ]);

      result.push(stdout);
      result.push(stderr);
    }

    if (currentRoutes.stdout.includes("default via 192.168.0.100 dev usb0")) {
      const { stdout, stderr } = await execa("ip", [
        "route",
        "del",
        "default",
        "via",
        "192.168.0.100",
      ]);

      result.push(stdout);
      result.push(stderr);
    }

    const addEth = await execa("ip", [
      "route",
      "add",
      "default",
      "via",
      "192.168.1.1",
      "metric",
      "1",
    ]);

    const addUsb = await execa("ip", [
      "route",
      "add",
      "default",
      "via",
      "192.168.0.100",
      "metric",
      "2",
    ]);

    logger("The routes was reset ✅");
    logger(
      JSON.stringify(
        [...result, addEth.stdout, addEth.stderr, addUsb.stdout, addUsb.stderr],
        null,
        2,
      ),
    );
  } catch (error) {
    logger("Reset routes was failed 🚨");

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error("RESET_ROUTES_FAILED");
  }
};

export const removeEthRoute = async () => {
  try {
    logger("Try change metric to 3 of eth0 ℹ️");

    const currentRoutes = await execa("ip", ["route"]);

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0 metric 1")) {
      const delEth = await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]);
      const addEth = await execa("ip", [
        "route",
        "add",
        "default",
        "via",
        "192.168.1.1",
        "metric",
        "3",
      ]);

      logger("The eth0 route was downgraded to 3 ✅");
      logger(delEth.stdout);
      logger(delEth.stderr);
      logger(addEth.stdout);
      logger(addEth.stderr);
    }
  } catch (error) {
    logger("The eth0 route was not downgraded to 3 🚨");

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error("CHANGE_ETH0_ROUTE_FAILED");
  }
};

export const addEthRoute = async () => {
  try {
    const currentRoutes = await execa("ip", ["route"]);

    logger("Try change metric to 1 of eth0 ℹ️");

    if (currentRoutes.stdout.includes("default via 192.168.1.1 dev eth0 metric 3")) {
      const delEth = await execa("ip", ["route", "del", "default", "via", "192.168.1.1"]);
      const addEth = await execa("ip", [
        "route",
        "add",
        "default",
        "via",
        "192.168.1.1",
        "metric",
        "1",
      ]);

      logger("The router eth0 was upgraded to 1 ✅");
      logger(delEth.stdout);
      logger(delEth.stderr);
      logger(addEth.stdout);
      logger(addEth.stderr);
    }
  } catch (error) {
    logger("The eth0 route was not upgraded to 1 🚨");

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error("CHANGE_ETH0_ROUTE_FAILED");
  }
};

import mqtt from "mqtt";
import { Logger } from "pino";

import { Config } from "../../config";

type RunWirenboard = {
  config: Config;
  logger: Logger;
};

const WBIO_8_DAC_TOPIC = "/devices/wb-dac/controls/EXT8";

export const runWirenboard = ({ config, logger }: RunWirenboard) => {
  const client = mqtt.connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  client.on("connect", function (error) {
    if (error) {
      logger.error(
        {
          err: error,
        },
        "Unable to establish connection with wirenboard 🚨",
      );

      return;
    }

    logger.info(config.mosquitto, "Connection to the wirenboard is established ✅");

    client.subscribe(WBIO_8_DAC_TOPIC);
  });

  client.on("reconnect", () => {
    logger.warn("The connection with the WB was reconnected 🚨");
  });

  client.on("offline", () => {
    logger.warn("The connection with the WB has switched to the offline state 🚨");
  });

  client.on("close", () => {
    logger.warn("The connection with the WB was closed 🚨");
  });

  client.on("disconnect", () => {
    logger.warn("The connection with the WB was disconnected 🚨");
  });

  client.on("end", () => {
    logger.warn("The connection with the WB was ended 🚨");
  });

  client.on("error", (error) => {
    logger.error(
      {
        err: error,
      },
      "An error occurred in the MQTT connection to the WB 🚨",
    );
  });

  const publishWirenboardMessage = async (
    topic: string,
    message: string | Buffer,
  ): Promise<undefined | Error> => {
    return new Promise((resolve) => {
      client.publish(topic, message, (error) => {
        if (error) {
          logger.error(
            {
              err: error,
            },
            "An error occurred in the MQTT connection to the WB 🚨",
          );

          resolve(error);

          return;
        }

        resolve(undefined);
      });
    });
  };

  client.on("message", (topic: string, message: Buffer) => {
    /**
     * https://wirenboard.com/ru/product/WBIO-AO-10V-8/
     * Может принимать значение от 0 до 10_000
     */

    if (topic.includes(WBIO_8_DAC_TOPIC)) {
      const pin = parseInt(topic.replace(WBIO_8_DAC_TOPIC, ""));
      const value = parseInt(message.toString());

      if (!Number.isSafeInteger(pin) || !Number.isSafeInteger(value)) {
        logger.error({ topic, pin, value }, "Pin or value is not a integer 🚨");

        return;
      }

      logger.debug({ topic, pin, value }, "WBIO-AO-10V-8 EXT_8 Message was parsed ✅");
    }
  });

  return () => {
    client.end();
  };
};

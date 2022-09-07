import EventEmitter from "events";

import debug from "debug";
import mqtt from "mqtt";

import { Config } from "../../config";

import { onMessage } from "./on-message";

type RunWirenboard = {
  config: Config;
};

const logger = debug("wirenboard");

const ROOT_TOPIC = "/devices/#";

const eventemitter = new EventEmitter();

export const runWirenboard = async ({ config }: RunWirenboard) => {
  logger("Try to establish connection with wirenboard ℹ️");
  logger(
    `Socket: ${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port} ℹ️`,
  );

  const client = mqtt.connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  await new Promise((resolve, reject) => {
    client.on("connect", () => {
      client.subscribe(ROOT_TOPIC, (error) => {
        if (error) {
          logger("Unable to establish connection with wirenboard 🚨");
          logger(error.message);

          return reject();
        }

        logger("Connection to the wirenboard is established ✅");

        resolve(undefined);
      });
    });
  });

  client.on("error", (error) => {
    logger("An error occurred in the MQTT connection to the WB 🚨");
    logger(error.message);
  });

  client.on("message", (topic, message) => onMessage(eventemitter, topic, message));

  return {
    client,
    eventemitter,
    stopWirenboard: () => {
      eventemitter.removeAllListeners();
      client.unsubscribe(ROOT_TOPIC);
      client.end();
    },
  };
};

import mqtt from "mqtt";

import { Config } from "../../config";

type RunWirenboard = {
  config: Config;
};

export const runWirenboard = ({ config }: RunWirenboard) => {
  const client = mqtt.connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  client.on("connect", function () {
    client.subscribe("/devices/#");
  });

  client.on("message", function (topic, message) {
    console.log(topic, message.toString());
  });

  return () => {
    client.end();
  };
};

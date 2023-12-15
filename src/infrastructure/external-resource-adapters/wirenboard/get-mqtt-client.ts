import debug from 'debug';
import { MqttClient, connect } from 'mqtt';

import { Config } from '../../config';

const logger = debug('get-mqtt-client');

type GetMqttClient = {
  config: Config;
  rootTopic: string;
};

export const getMqttClient = async ({ config, rootTopic }: GetMqttClient) => {
  logger('Try to establish mqtt connection with Wirenboard 🚀');
  logger(
    JSON.stringify(
      { broker: `${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port}` },
      null,
      2,
    ),
  );

  const client = connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  await new Promise<MqttClient | Error>((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe(rootTopic, (error) => {
        if (error) {
          logger('Unable to establish mqtt connection with wirenboard 🚨');
          logger(JSON.stringify({ error }, null, 2));

          return reject(error);
        }

        logger('The mqtt connection to the wirenboard is established ✅ 🚀');

        resolve(client);
      });
    });
  });

  client.on('disconnect', () => {
    logger('The mqtt connection with wirenboard was disconnected 👷‍♂️');
  });

  client.on('reconnect', () => {
    logger('The mqtt connection to the wirenboard was reconnected ✅ 🚀');
  });

  client.on('error', (error) => {
    if (error) {
      logger('An error occurred in the MQTT connection to the wirenboard 🚨');
      logger(JSON.stringify({ error }, null, 2));
    }
  });

  return client;
};

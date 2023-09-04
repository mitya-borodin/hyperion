import { MqttClient, connect } from 'mqtt';
import { Logger } from 'pino';

import { Config } from '../../config';

type GetMqttClient = {
  config: Config;
  logger: Logger;
  rootTopic: string;
};

export const getMqttClient = async ({ config, logger, rootTopic }: GetMqttClient) => {
  logger.info(
    { broker: `${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port}` },
    'Try to establish mqtt connection with Wirenboard 🚀',
  );

  const client = connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  const result = await new Promise<MqttClient | Error>((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe(rootTopic, (error) => {
        if (error) {
          logger.error({ err: error }, 'Unable to establish mqtt connection with wirenboard 🚨');

          return reject(error);
        }

        logger.info('The mqtt connection to the wirenboard is established ✅ 🚀');

        resolve(client);
      });
    });
  });

  client.on('error', (error) => {
    logger.error({ err: error }, 'An error occurred in the MQTT connection to the WB 🚨');
  });

  return result;
};

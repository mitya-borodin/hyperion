import debug from 'debug';
import { MqttClient, connect } from 'mqtt';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { Config } from '../config';

const logger = debug('hyperion:mqtt');

type GetMqttClient = {
  config: Config;
  rootTopic: string;
};

export const getMqttClient = async ({ config, rootTopic }: GetMqttClient) => {
  logger('Try to establish connection with mqtt broker 🛜');
  logger(
    stringify({
      broker: `${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port}`,
      rootTopic,
    }),
  );

  const client = connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  await new Promise<MqttClient>((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe(rootTopic, (error) => {
        if (error) {
          logger('Unable to establish connection with mqtt broker 🚨');
          logger(stringify({ rootTopic, error }));

          return reject(new Error(ErrorType.UNEXPECTED_BEHAVIOR));
        }

        logger('The connection with mqtt broker was established 🛜 ✅');
        logger(stringify({ rootTopic }));

        resolve(client);
      });
    });
  });

  client.on('disconnect', () => {
    logger('The connection with mqtt broker was disconnected 👷‍♂️');
    logger(stringify({ rootTopic }));
  });

  client.on('reconnect', () => {
    logger('The connection to the mqtt broker was reconnected ✅ 🚀');
    logger(stringify({ rootTopic }));
  });

  client.on('error', (error) => {
    if (error) {
      logger('An error occurred in connecting to the mqtt broker 🚨');
      logger(stringify({ rootTopic, error }));
    }
  });

  return client;
};

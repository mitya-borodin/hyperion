import { MqttClient } from 'mqtt';
import { Logger } from 'pino';

import { ErrorType } from '../../../helpers/error-type';

type PublishWirenboardMessage = {
  logger: Logger;
  client: MqttClient;
  topic: string;
  message: string;
};

export const publishWirenboardMessage = async ({
  logger,
  client,
  topic,
  message,
}: PublishWirenboardMessage): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    if (typeof topic !== 'string') {
      logger.error({ topic, message }, 'The topic should be a string 🚨');

      resolve(new Error(ErrorType.INVALID_ARGUMENTS));

      return;
    }

    if (typeof message !== 'string') {
      logger.error({ topic, message }, 'The message should be a string 🚨');

      resolve(new Error(ErrorType.INVALID_ARGUMENTS));

      return;
    }

    logger.info({ topic, message }, 'The message to wirenboard will be send 🌍 🚀 🏃 🍋');

    client.publish(topic, message, (error) => {
      if (error) {
        logger.error({ err: error }, 'An error occurred when sending a message via MQTT WB 🚨');

        resolve(error);

        return;
      }

      logger.info({ topic, message, error }, 'The message to wirenboard was sent ✅');

      // eslint-disable-next-line unicorn/no-useless-undefined
      resolve(undefined);
    });
  });
};

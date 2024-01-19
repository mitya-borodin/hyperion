import debug from 'debug';
import { MqttClient } from 'mqtt';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';

const logger = debug('hyperion-publish-wirenboard-message');

export type MqttMessage = {
  topic: string;
  message: string;
};

type PublishMqttMessage = {
  client: MqttClient;
};

export const publishMqttMessage = async ({
  client,
  topic,
  message,
}: PublishMqttMessage & MqttMessage): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    if (typeof topic !== 'string') {
      logger('The topic should be a string 🚨');
      logger(stringify({ topic, message }));

      resolve(new Error(ErrorType.INVALID_ARGUMENTS));

      return;
    }

    if (typeof message !== 'string') {
      logger('The message should be a string 🚨');
      logger(stringify({ topic, message }));

      resolve(new Error(ErrorType.INVALID_ARGUMENTS));

      return;
    }

    logger('Try to send message to mqtt broker ⬆️ 📦 ⛵️ 💌 ⬆️');
    logger(stringify({ topic, message }));

    client.publish(topic, message, (error) => {
      if (error) {
        logger('The message could not be sent to mqtt broker 🚨');
        logger(stringify({ topic, message, error }));

        resolve(new Error(ErrorType.UNEXPECTED_BEHAVIOR));

        return;
      }

      logger('The message was successfully sent to mqtt broker ✅ ⛵️ ⬆️ 📦 ⛵️ 💌 ⬆️');

      // eslint-disable-next-line unicorn/no-useless-undefined
      resolve(undefined);
    });
  });
};

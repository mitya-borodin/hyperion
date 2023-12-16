import debug from 'debug';
import { MqttClient } from 'mqtt';

import { ErrorType } from '../../../helpers/error-type';
import { stringify } from '../../../helpers/json-stringify';

const logger = debug('hyperion-publish-wirenboard-message');

type PublishWirenboardMessage = {
  client: MqttClient;
  topic: string;
  message: string;
};

export const publishWirenboardMessage = async ({
  client,
  topic,
  message,
}: PublishWirenboardMessage): Promise<undefined | Error> => {
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

    logger('The message to wirenboard will be send 🌍 🚀 🏃 🍋');
    logger(stringify({ topic, message }));

    client.publish(topic, message, (error) => {
      if (error) {
        logger('An error occurred when sending a message via MQTT WB 🚨');
        logger(stringify({ error }));

        resolve(error);

        return;
      }

      logger('The message to wirenboard was sent ✅');

      // eslint-disable-next-line unicorn/no-useless-undefined
      resolve(undefined);
    });
  });
};

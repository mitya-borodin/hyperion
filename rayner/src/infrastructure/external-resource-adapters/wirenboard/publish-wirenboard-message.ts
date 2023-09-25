import { MqttClient } from 'mqtt';
import { Logger } from 'pino';

type PublishWirenboardMessage = {
  logger: Logger;
  client: MqttClient;
  topic: string;
  message: Buffer;
};

export const publishWirenboardMessage = async ({
  logger,
  client,
  topic,
  message,
}: PublishWirenboardMessage): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    client.publish(topic, message, (error) => {
      if (error) {
        logger.error({ err: error }, 'An error occurred when sending a message via MQTT WB 🚨');

        resolve(error);

        return;
      }

      // eslint-disable-next-line unicorn/no-useless-undefined
      resolve(undefined);
    });
  });
};

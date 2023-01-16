import debug from 'debug';
import { MqttClient } from 'mqtt';

const logger = debug('wirenboard:publish:message');

export const publishWirenboardMessage = async (
  client: MqttClient,
  topic: string,
  message: Buffer,
): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    client.publish(topic, message, (error) => {
      if (error) {
        logger('An error occurred when sending a message via MQTT WB 🚨');
        logger(error);

        resolve(error);

        return;
      }

      resolve();
    });
  });
};

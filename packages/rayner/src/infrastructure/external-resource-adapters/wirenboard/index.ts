import EventEmitter from 'node:events';

import debug from 'debug';
import { connect } from 'mqtt';

import { Config } from '../../config';

type RunWirenboard = {
  config: Config;
};

const logger = debug('wirenboard');

const ROOT_TOPIC = '/devices/#';

// eslint-disable-next-line unicorn/prefer-event-target
const eventemitter = new EventEmitter();

/**
 * ! https://github.com/wirenboard/conventions
 */
export const runWirenboard = async ({ config }: RunWirenboard) => {
  logger('Try to establish connection with wirenboard ℹ️');
  logger(`Socket: ${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port} ℹ️`);

  const client = connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  await new Promise((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe(ROOT_TOPIC, (error) => {
        if (error) {
          logger('Unable to establish connection with wirenboard 🚨');
          logger(error.message);

          return reject();
        }

        logger('Connection to the wirenboard is established ✅');

        resolve('');
      });
    });
  });

  client.on('error', (error) => {
    logger('An error occurred in the MQTT connection to the WB 🚨');
    logger(error.message);
  });

  client.on('message', (topic, message) => {
    /**
     * ! В рамках нашей системы, не рассматриваются другие топики.
     */
    if (!topic.startsWith('/devices')) {
      return;
    }

    /**
     * ! В рамках нашей системы, не рассматриваются сетевые соединения.
     */
    if (topic.startsWith('/devices/system__networks')) {
      return;
    }

    /**
     * ! META
     */
    if (topic.includes('meta')) {
      try {
        const [device, type, ...path] = topic.replace('/devices/', '').split('/');

        if (type === 'meta') {
          const [error] = path;

          if (error === 'error') {
            /**
             * ! https://github.com/wirenboard/conventions#errors
             *
             * * /devices/+/controls/+/meta/error topics can contain a combination of values:
             * * r - read from device error
             * * w - write to device error
             * * p - read period miss
             */
            // console.log(device, type, error, message.toString());
          }

          /**
           * ! https://github.com/wirenboard/conventions#devices-meta-topic
           *
           * ! /devices/RoomLight/meta - JSON with all meta information about device
           *
           * ! Дает информацию о том, какие устройства имеются и как они называются.
           * ? Можно использовать совместно с https://github.com/wirenboard/conventions#controlss-meta-topic
           */
          if (error !== 'error') {
            // console.log(device, type, JSON.parse(message.toString()));
          }
        }

        if (type === 'controls') {
          const [control, meta, error] = path;

          /**
           * ! /devices/RoomLight/controls/Switch/meta/error
           *
           * ! non-null value means there was an error reading or writing the control.
           *
           * ! Дает информацию о ошибке на конкретной ручке устройства.
           * ? Можно использовать для отображения статуса ошибки конкретной ручки.
           */
          if (error === 'error') {
            // console.log(device, control, meta, JSON.parse(message.toString()));
          }

          /**
           * ! https://github.com/wirenboard/conventions#controlss-meta-topic
           *
           * ! JSON with all meta information about control
           *
           * ! Дает информацию о том, какие параметры имеются в устройстве, и как их можно использовать.
           * ? Можно использовать только эти данные для составления схем устройств.
           */
          if (!error) {
            // console.log(device, control, meta, JSON.parse(message.toString()));
          }
        }
      } catch (error) {
        logger(error);
      }
    }

    /**
     * ! DATA
     */
    if (!topic.includes('meta')) {
      try {
        const [device, type, ...path] = topic.replace('/devices/', '').split('/');

        console.log([device, type, ...path], message.toString());
      } catch (error) {
        logger(error);
      }
    }
  });

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

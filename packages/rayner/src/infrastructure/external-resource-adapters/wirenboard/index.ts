import debug from 'debug';
import { connect } from 'mqtt';

import { isJson } from '../../../helpers/is-json';
import { Config } from '../../config';

type RunWirenboard = {
  config: Config;
};

const logger = debug('wirenboard');

const ROOT_TOPIC = '/devices/#';

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

  client.on('message', (topic, messageBuffer) => {
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

    const message = messageBuffer.toString();

    /**
     * ! META
     */
    if (topic.includes('meta')) {
      try {
        const [device, type, ...path] = topic.replace('/devices/', '').split('/');

        if (type === 'meta') {
          const [error] = path;

          /**
           * * Канал: devices-meta
           *
           * ! https://github.com/wirenboard/conventions#devices-meta-topic
           *
           * ! /devices/+/meta - JSON with all meta information about device
           *
           * ! Дает информацию:
           * ! 1. Идентификатор устройства
           * ! 2. Какой драйвер используется
           * ! 3. Название устройства
           * ? 4. Возможно ещё какие-то данные, на текущем оборудовании других нет.
           *
           * * Нужно подождать 2000 мс, после последнего сообщения из этого канала, и продолжить.
           */
          if (error !== 'error' && isJson(message)) {
            // console.log(device, type, JSON.parse(message));
          }

          /**
           * * Канал: devices-meta-error
           *
           * ! https://github.com/wirenboard/conventions#errors
           * ! Device-level error state, non-null means there was an error (usable as Last Will and Testament)
           *
           * ! /devices/+/meta/error
           *
           * ! Дает информацию:
           * ! 1. Идентификатор устройства
           * ! 2. Текс ошибки всего устройства
           *
           * * Не использовать канал пока не получим сообщение из devices-meta и controls-meta
           */
          if (error === 'error') {
            // if (isJson(message)) {
            //   console.log(device, type, error, JSON.parse(message));
            // } else {
            //   console.log(device, type, error, message);
            // }
          }
        }

        if (type === 'controls') {
          const [control, meta, error] = path;

          /**
           * * Канал: controls-meta
           *
           * ! https://github.com/wirenboard/conventions#controlss-meta-topic
           *
           * ! JSON with all meta information about control
           *
           * ! Дает информацию:
           * ! 1. Идентификатор устройства
           * ! 2. Идентификатор контрола
           * ! 3. Порядок расположения поля в списке
           * ! 4. Статус readonly
           * ! 5. Тип
           * ! 6. Единицу измерения если она есть
           * ! 7. Название с переводом если оно есть
           *
           * * Нужно подождать 2000 мс, после последнего сообщения из этого канала, и продолжить.
           */
          if (!error) {
            // console.log(device, control, meta, JSON.parse(message));
          }

          /**
           * * Канал: controls-meta-error
           *
           * ! https://github.com/wirenboard/conventions#errors
           *
           * ! non-null value means there was an error reading or writing the control.
           *
           * ! /devices/+/controls/+/meta/error topics can contain a combination of values:
           * ! r - read from device error
           * ! w - write to device error
           * ! p - read period miss
           *
           * ! Дает информацию:
           * ! 1. Идентификатор устройства
           * ! 2. Идентификатор контрола
           * ! 3. Статус ошибки, если статус пустой то ошибки нет
           *
           * * Не использовать канал пока не получим сообщение из devices-meta и controls-meta
           */
          if (error === 'error') {
            // console.log(device, control, meta, message);
          }
        }
      } catch {
        logger('Error 🚨', topic, message.toString());
      }
    }

    /**
     * ! DATA
     */
    if (!topic.includes('meta')) {
      try {
        /**
         * * Канал: controls-value
         *
         * ! https://github.com/wirenboard/conventions#units
         *
         * ! /devices/+/controls/+ topics can contain a value of control.
         *
         * ! Дает информацию:
         * ! 1. Идентификатор устройства
         * ! 2. Идентификатор контрола
         * ! 3. Значение контрола
         *
         * * Не использовать канал пока не получим сообщение из devices-meta и controls-meta
         */
        const [device, type, ...path] = topic.replace('/devices/', '').split('/');

        console.log([device, type, ...path], message);
      } catch {
        logger('Error 🚨', topic, message.toString());
      }
    }
  });

  /**
   * * По итогу мы должны получить информацию из каналов devices-meta и controls-meta,
   * * и только после этого взять информацию из каналов devices-meta-error и controls-meta-error.
   *
   * ! Исходя из каналов devices-meta, devices-meta-error, controls-meta, controls-meta-error, controls-value
   * ! получим текущее состояние устройства и его контролов, и это состояние будет передано на слой application-service
   * ! где будет переписано в БД, и аналитику по устройству.
   *
   * ! На этом сбор данных заканчивается, и дальше уже можно размечать устройства через GUI по типу, назначению и
   * ! другим параметрам.
   *
   * ! После разметки устройства могут быть использованы в пресетах.
   */

  return {
    stopWirenboard: () => {
      client.unsubscribe(ROOT_TOPIC);
      client.end();
    },
  };
};

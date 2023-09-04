import { Logger } from 'pino';

import { WirenboardDevice } from '../../../domain/wirenboard-device';
import { isJson } from '../../../helpers/is-json';

import { getMqttClient } from './get-mqtt-client';

import { Config } from '../../config';

type RunWirenboard = {
  config: Config;
  logger: Logger;
};

type RunWirenboardResult = {
  stop: () => void;
};

const ROOT_TOPIC = '/devices/#';

/**
 * ! https://github.com/wirenboard/conventions
 */
export const runWirenboard = async ({ config, logger }: RunWirenboard): Promise<Error | RunWirenboardResult> => {
  const client = await getMqttClient({ config, logger, rootTopic: ROOT_TOPIC });

  if (client instanceof Error) {
    return client;
  }

  client.on('message', (topic: string, messageBuffer: Buffer) => {
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
     * * META
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
            const { driver, title, ...meta } = JSON.parse(message);

            const wirenboardDevice: WirenboardDevice = {
              id: device,
              driver,
              title: {
                ru: title?.ru,
                en: title?.en,
              },
              meta,
            };

            // console.log(JSON.stringify(wirenboardDevice, null, 2));
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
            if (isJson(message)) {
              const wirenboardDevice: WirenboardDevice = {
                id: device,
                error: JSON.parse(message),
              };

              // console.log(device, type, error, wirenboardDevice);
            } else {
              const wirenboardDevice: WirenboardDevice = {
                id: device,
                error: message,
              };

              // console.log(device, type, error, message, wirenboardDevice);
            }
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
            const { title, order, readonly, type, units, max, min, precision, ...meta } = JSON.parse(message);

            const wirenboardDevice: WirenboardDevice = {
              id: device,
              controls: {
                [control]: {
                  title: {
                    ru: title?.ru,
                    en: title?.en,
                  },
                  order,
                  readonly,
                  type,
                  units,
                  max,
                  min,
                  precision,
                  topic: readonly ? undefined : `/devices/${device}/controls/${control}/on`,
                  meta,
                },
              },
            };

            // console.log(JSON.stringify(wirenboardDevice, null, 2));
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
            const wirenboardDevice: WirenboardDevice = {
              id: device,
              controls: {
                [control]: {
                  error: message,
                },
              },
            };

            // console.log(wirenboardDevice);
          }
        }
      } catch (error) {
        logger.error({ err: error, topic, message: message.toString() }, 'Could not get meta information 🚨');
      }
    }

    /**
     * * VALUE
     */
    if (!topic.includes('meta')) {
      const message = messageBuffer.toString();

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
        const [device, type, control] = topic.replace('/devices/', '').split('/');

        const wirenboardDevice: WirenboardDevice = {
          id: device,
          controls: {
            [control]: {
              value: message,
            },
          },
        };

        // console.log(wirenboardDevice);
      } catch (error) {
        logger.error({ err: error, topic, message: message.toString() }, 'Could not get controls value 🚨');
      }
    }
  });

  return {
    stop: () => {
      client.removeAllListeners();
      client.unsubscribe(ROOT_TOPIC);
      client.end();
    },
  };
};

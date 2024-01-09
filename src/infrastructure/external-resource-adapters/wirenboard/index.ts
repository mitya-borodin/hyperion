/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'node:events';

import debug from 'debug';

import { EventBus } from '../../../domain/event-bus';
import { HardwareDevice } from '../../../domain/hardware-device';
import { isJson } from '../../../helpers/is-json';
import { Config } from '../../config';
import { getMqttClient } from '../get-mqtt-client';
import { MqttMessage, publishMqttMessage } from '../publish-mqtt-message';

const logger = debug('hyperion-run-wirenboard');

type RunWirenboard = {
  config: Config;
  eventBus: EventEmitter;
};

type RunWirenboardResult = {
  stop: () => void;
};

const ROOT_TOPIC = '/devices/#';

/**
 * ! https://github.com/wirenboard/conventions
 */
export const runWirenboard = async ({ config, eventBus }: RunWirenboard): Promise<RunWirenboardResult> => {
  const client = await getMqttClient({ config, rootTopic: ROOT_TOPIC });

  /**
   * ! Получение состояние контроллера
   */
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

            const hardwareDevice: HardwareDevice = {
              id: device,
              driver,
              title: {
                ru: title?.ru,
                en: title?.en,
              },
              meta,
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
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
              const hardwareDevice: HardwareDevice = {
                id: device,
                error: JSON.parse(message),
              };

              eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
            } else {
              const hardwareDevice: HardwareDevice = {
                id: device,
                error: message,
              };

              eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
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

            const hardwareDevice: HardwareDevice = {
              id: device,
              controls: {
                [control]: {
                  id: control,
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

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
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
            const hardwareDevice: HardwareDevice = {
              id: device,
              controls: {
                [control]: {
                  id: control,
                  error: message,
                },
              },
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
          }
        }
      } catch (error) {
        logger('Could not get meta information 🚨');
        logger(JSON.stringify({ error, topic, message: message.toString() }, null, 2));
      }
    }

    /**
     * * VALUE
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
        const [device, type, control] = topic.replace('/devices/', '').split('/');

        const hardwareDevice: HardwareDevice = {
          id: device,
          controls: {
            [control]: {
              id: control,
              value: message,
            },
          },
        };

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
      } catch (error) {
        logger('Could not get controls value 🚨');
        logger(JSON.stringify({ error, topic, message: message.toString() }, null, 2));
      }
    }
  });

  /**
   * ! Изменение состояния контроллера
   */
  const publishMessage = ({ topic, message }: MqttMessage) => {
    publishMqttMessage({ client, topic, message });
  };

  eventBus.on(EventBus.WB_PUBLISH_MESSAGE, publishMessage);

  return {
    stop: () => {
      eventBus.off(EventBus.WB_PUBLISH_MESSAGE, publishMessage);

      client.removeAllListeners();
      client.unsubscribe(ROOT_TOPIC);
      client.end();
    },
  };
};

/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'node:events';

import debug from 'debug';

import { EventBus } from '../../../domain/event-bus';
import { HardwareDevice } from '../../../domain/hardware-device';
import { isJson } from '../../../helpers/is-json';
import { stringify } from '../../../helpers/json-stringify';
import { IHyperionDeviceRepository } from '../../../ports/hyperion-device-repository';
import { Config } from '../../config';
import { getMqttClient } from '../get-mqtt-client';
import { MqttMessage, publishMqttMessage } from '../publish-mqtt-message';

import { decodeAccessBitMask } from './decode-access-bit-mask';

const logger = debug('hyperion-run-zigbee2mqtt');

type RunZigbee2mqtt = {
  config: Config;
  eventBus: EventEmitter;
  hyperionDeviceRepository: IHyperionDeviceRepository;
};

type RunZigbee2mqttResult = {
  stop: () => void;
};

const ieeeAddressByFriendlyName = new Map<string, string>();

const DRIVER = 'zigbee2mqtt';
/**
 *
 * ! https://www.zigbee2mqtt.io
 */
export const runZigbee2mqtt = async ({
  config,
  eventBus,
  hyperionDeviceRepository,
}: RunZigbee2mqtt): Promise<Error | RunZigbee2mqttResult> => {
  /**
   * ! Подготовка карты, для получения ieee_address по friendly_name,
   * ! чтобы мы могли задавать любой FN любым способом, и не порождать артефакты.
   */
  const devices = await hyperionDeviceRepository.getAll();

  if (devices instanceof Error) {
    return devices;
  }

  for (const device of devices) {
    if (device.driver === DRIVER) {
      ieeeAddressByFriendlyName.set(device.meta?.friendly_name as string, device.id);
    }
  }

  /**
   * * PROCESSING STATE CHANGES OF END DEVICES
   */
  const client = await getMqttClient({ config, rootTopic: `${config.zigbee2mqtt.baseTopic}/#` });

  /**
   * ! Получение состояние zigbee-bridge
   */
  client.on('message', (topic: string, messageBuffer: Buffer) => {
    /**
     * ! Общение происходит только с base_topic процесса zigbee2mqtt
     * ! https://www.zigbee2mqtt.io/guide/configuration/mqtt.html#mqtt
     *
     * * Optional: MQTT base topic for Zigbee2MQTT MQTT messages (default: zigbee2mqtt)
     * * base_topic: zigbee2mqtt
     */
    if (!topic.startsWith(config.zigbee2mqtt.baseTopic)) {
      return;
    }

    const message = messageBuffer.toString();

    if (!isJson(message)) {
      logger('A message was received in a non-JSON format ⬇️  🍟 ⬇️');
      logger(topic, message);

      return;
    }

    /**
     * ! https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-bridge-logging
     */
    if (topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge/logging`)) {
      logger('A log was received from zigbee2mqtt ⬇️  📑 🪵 ⬇️', stringify(JSON.parse(message)));

      return;
    }

    /**
     * ! https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-bridge-devices
     * ! Получаем полный список устройств подключенных к мосту
     */
    if (topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge/devices`)) {
      logger('Information about all zigbee devices has been received ⬇️  ✅ ⬇️');

      const devices = JSON.parse(message);

      for (const device of devices) {
        if (device.type === 'Coordinator') {
          logger("Skipping the coordinator's processing ⏭️");

          continue;
        }

        if (!device.supported) {
          logger('Zigbee device is not supported 🚨', stringify(device));

          continue;
        }

        logger(topic);
        logger(
          'Device info 🍋',
          stringify({
            ieee_address: device.ieee_address,
            friendly_name: device.friendly_name,
            description: device.description,
            power_source: device.power_source,
            interviewing: device.interviewing,
            interview_completed: device.interview_completed,
          }),
        );
        logger(
          'Definition info 🍟',
          stringify({
            vendor: device.definition.vendor,
            model: device.definition.model,
            description: device.definition.description,
          }),
        );

        const deviceId = device.ieee_address;
        const friendlyName = device.friendly_name;

        /**
         * ! UPDATE MAP FOR HANDLE CHANGES BY FRIENDLY NAME
         */
        ieeeAddressByFriendlyName.set(friendlyName, deviceId);

        for (const expose of device.definition.exposes) {
          const { canBeFoundInPublishedState, canBeSet, canBeGet } = decodeAccessBitMask(expose.access);

          /**
           * ! GENERAL
           */
          if (expose.type === 'binary') {
            const wirenboardDevice: HardwareDevice = {
              id: deviceId,
              driver: DRIVER,
              title: {
                ru: friendlyName,
                en: friendlyName,
              },
              error: undefined,
              meta: device,
              controls: {
                [expose.property]: {
                  id: expose.property,
                  title: {
                    ru: expose.label,
                    en: expose.label,
                  },
                  order: undefined,
                  readonly: !canBeSet,
                  type: expose.type,
                  units: expose.unit,
                  max: expose.value_max,
                  min: expose.value_min,
                  precision: 2,
                  value: undefined,
                  topic: canBeSet
                    ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.property}`
                    : undefined,
                  error: undefined,
                  meta: expose,
                },
              },
            };
          }

          if (expose.type === 'numeric') {
            logger('NUMERIC');
          }

          if (expose.type === 'enum') {
            logger('ENUM');
          }

          if (expose.type === 'text') {
            logger('TEXT');
          }

          if (expose.type === 'composite') {
            logger('COMPOSITE');
          }

          if (expose.type === 'list') {
            logger('LIST');
          }

          /**
           * ! SPECIFIC
           */
          if (expose.type === 'light') {
            logger('LIGHT');
          }

          if (expose.type === 'switch') {
            logger('SWITCH');
          }

          if (expose.type === 'fan') {
            logger('FAN');
          }

          if (expose.type === 'cover') {
            logger('COVER');
          }

          if (expose.type === 'lock') {
            logger('LOCK');
          }

          if (expose.type === 'climate') {
            logger('CLIMATE');
          }

          logger(stringify({ expose, canBeFoundInPublishedState, canBeSet, canBeGet }));
        }
      }

      return;
    }

    /**
     * ! Информация о доступности устройств на текущий момент, определение
     * ! онлайн или офлайн выполняется в процессе zigbee2mqtt.
     */
    if (topic.endsWith('/availability')) {
      logger('Information about device availability was obtained from the zigbee2mqtt process ⬇️  🌍 ⬇️ ', {
        topic,
        ...JSON.parse(message),
      });

      return;
    }

    if (
      topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge`) ||
      topic.endsWith('/get') ||
      topic.endsWith('/set')
    ) {
      return;
    }

    /**
     * ! Данные устройств, идентификатор находится в топике, но его может там не быть, в зависимости от настройки.
     * ! По этому нужно, чтобы в FRIENDLY_NAME был ieee_address, иначе при изменении имени, может пропасть
     * ! связь с объектами hyperion.
     * * https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-friendly-name
     */
    logger(topic, stringify(JSON.parse(message)));
  });

  /**
   * * CHANGING THE STATE OF TERMINAL DEVICES
   *
   * ! Изменение состояния zigbee устройств через
   * ! mosquitto cloud -> mosquitto wb -> zigbee2mqtt -> zigbee hardware -> end device
   */
  const publishMessage = ({ topic, message }: MqttMessage) => {
    publishMqttMessage({ client, topic, message });
  };

  eventBus.on(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, publishMessage);

  return {
    stop: () => {
      eventBus.off(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, publishMessage);

      client.removeAllListeners();
      client.unsubscribe(`${config.zigbee2mqtt.baseTopic}/#`);
      client.end();
    },
  };
};

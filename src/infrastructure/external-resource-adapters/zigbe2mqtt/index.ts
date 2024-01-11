/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'node:events';

import debug from 'debug';

import { ControlType } from '../../../domain/control-type';
import { EventBus } from '../../../domain/event-bus';
import { HardwareControl, HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDeviceControl } from '../../../domain/hyperion-control';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { getControlId } from '../../../domain/macroses/get-control-id';
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

const hyperionDevices = new Map<string, HyperionDevice>();
const hyperionControls = new Map<string, HyperionDeviceControl>();

const accept = (device: HyperionDevice) => {
  hyperionDevices.set(device.id, device);

  for (const control of device.controls) {
    hyperionControls.set(getControlId({ deviceId: device.id, controlId: control.id }), control);
  }
};

const ieeeAddressByFriendlyName = new Map<string, string>();

const fillIeeeAddressByFriendlyName = async (hyperionDeviceRepository: IHyperionDeviceRepository) => {
  const devices = await hyperionDeviceRepository.getAll();

  if (devices instanceof Error) {
    return devices;
  }

  for (const device of devices) {
    accept(device);

    if (device.driver === DRIVER) {
      ieeeAddressByFriendlyName.set(device.meta?.friendly_name as string, device.id);
    }
  }

  logger('The initial state of hyperion devices has been obtained ⬇️ ✅ ⬇️');
};

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
  logger('Run zigbee2mqtt converter 🏃🏼‍♀️ 🚀 🌍 ⛵️ 🧯');

  /**
   * ! FILL ADDRESS MAP
   */
  const filledIn = await fillIeeeAddressByFriendlyName(hyperionDeviceRepository);

  if (filledIn instanceof Error) {
    return filledIn;
  }

  /**
   * ! ACCEPT HYPERION DEVICES
   */
  eventBus.on(EventBus.HYPERION_DEVICE_APPEARED, accept);

  /**
   * ! PROCESSING STATE CHANGES OF END DEVICES
   */
  const client = await getMqttClient({ config, rootTopic: `${config.zigbee2mqtt.baseTopic}/#` });

  client.on('message', (topic: string, messageBuffer: Buffer) => {
    const isBaseTopic = topic.startsWith(config.zigbee2mqtt.baseTopic);
    const isBridgeTopic = topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge`);
    const isLoggingTopic = topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge/logging`);
    const isDevicesTopic = topic.startsWith(`${config.zigbee2mqtt.baseTopic}/bridge/devices`);
    const isAvailabilityTopic = isBaseTopic && topic.endsWith('/availability');

    if (!isBaseTopic) {
      return;
    }

    if (
      !isLoggingTopic &&
      !isDevicesTopic &&
      !isAvailabilityTopic &&
      (isBridgeTopic || (isBaseTopic && topic.endsWith('/get')) || (isBaseTopic && topic.endsWith('/set')))
    ) {
      return;
    }

    const message = messageBuffer.toString();

    if (!isJson(message)) {
      logger('A message was received in a non-JSON format ⬇️  🍟 ⬇️');
      logger(stringify({ topic, message }));

      return;
    }

    /**
     * https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-bridge-logging
     */
    if (isLoggingTopic) {
      // logger('A log was received from zigbee2mqtt ⬇️  📑 🪵 ⬇️');
      // logger(stringify(JSON.parse(message)));

      return;
    }

    /**
     * https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-bridge-devices
     */
    if (isDevicesTopic) {
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

        const deviceId = device.ieee_address;
        const friendlyName = device.friendly_name;

        const deviceMeta = {
          type: device.type,
          ieee_address: device.ieee_address,
          friendly_name: device.friendly_name,
          description: device.description,
          power_source: device.power_source,
          interviewing: device.interviewing,
          interview_completed: device.interview_completed,
          definition: {
            vendor: device.definition.vendor,
            model: device.definition.model,
            description: device.definition.description,
          },
        };

        /**
         * ! UPDATE MAP FOR HANDLE CHANGES BY FRIENDLY NAME
         */
        ieeeAddressByFriendlyName.set(friendlyName, deviceId);

        const exposes: any[] = [];
        const stack: any[] = device.definition.exposes;

        while (stack.length > 0) {
          const expose = stack.pop();
          const { property, features, path, topic } = expose;

          if (features) {
            stack.push(
              ...features.map((item: any) => {
                const label = expose.label ? `${expose.label} -> ${item.label}` : item.label;

                if (topic) {
                  return { ...item, label, path: `${path}.${property}`, topic: `${topic}/${property}` };
                }

                return { ...item, label, path: property, topic: property };
              }),
            );

            continue;
          }

          exposes.push({
            ...expose,
            topic: `${topic ? `${topic}/${property}` : property}`,
            path: `${path ? `${path}.${property}` : property}`,
          });
        }

        for (const expose of exposes) {
          const { canBeSet } = decodeAccessBitMask(expose.access);

          /**
           * ! GENERAL
           */
          if (expose.type === 'binary') {
            const hardwareDevice: HardwareDevice = {
              id: deviceId,
              title: {
                ru: friendlyName,
                en: friendlyName,
              },
              driver: DRIVER,
              meta: deviceMeta,
              controls: {
                [expose.path]: {
                  id: expose.path,

                  title: {
                    ru: expose.label,
                    en: expose.label,
                  },

                  type: ControlType.SWITCH,

                  readonly: !canBeSet,

                  on: expose.value_on,
                  off: expose.value_off,
                  toggle: expose.value_toggle,

                  topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
                },
              },
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
          }

          if (expose.type === 'numeric') {
            const hardwareDevice: HardwareDevice = {
              id: deviceId,
              title: {
                ru: friendlyName,
                en: friendlyName,
              },
              driver: DRIVER,
              meta: deviceMeta,
              controls: {
                [expose.path]: {
                  id: expose.path,

                  title: {
                    ru: expose.label,
                    en: expose.label,
                  },

                  type: ControlType.VALUE,

                  readonly: !canBeSet,

                  units: expose.unit,

                  max: expose.value_max,
                  min: expose.value_min,
                  step: expose.value_step,

                  presets: expose.presets,

                  topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
                },
              },
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
          }

          if (expose.type === 'enum') {
            const hardwareDevice: HardwareDevice = {
              id: deviceId,
              title: {
                ru: friendlyName,
                en: friendlyName,
              },
              driver: DRIVER,
              meta: deviceMeta,
              controls: {
                [expose.path]: {
                  id: expose.path,

                  title: {
                    ru: expose.label,
                    en: expose.label,
                  },

                  type: ControlType.ENUM,

                  readonly: !canBeSet,

                  enum: expose.values,

                  topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
                },
              },
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
          }

          if (expose.type === 'text') {
            const hardwareDevice: HardwareDevice = {
              id: deviceId,
              title: {
                ru: friendlyName,
                en: friendlyName,
              },
              driver: DRIVER,
              meta: deviceMeta,
              controls: {
                [expose.path]: {
                  id: expose.path,

                  title: {
                    ru: expose.label,
                    en: expose.label,
                  },

                  type: ControlType.TEXT,

                  readonly: !canBeSet,

                  topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
                },
              },
            };

            eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
          }

          if (expose.type === 'list') {
            logger(
              // eslint-disable-next-line max-len
              'The list type is not being processed at the moment, it is waiting for a device that can give such a type to look at the data before implementation 🚨 🚨 🚨',
            );
          }
        }
      }

      return;
    }

    if (isAvailabilityTopic) {
      const friendlyName = topic.replace(`${config.zigbee2mqtt.baseTopic}/`, '').replace('/availability', '');
      const ieeeAddress = ieeeAddressByFriendlyName.get(friendlyName);
      const { state } = JSON.parse(message);

      if (ieeeAddress) {
        logger('The device availability status has been received ⬇️ 📟 🛜 ⬇️');
        logger(stringify({ topic, state, friendlyName, ieeeAddress }));

        const hardwareDevice: HardwareDevice = {
          id: ieeeAddress,
          title: {
            ru: friendlyName,
            en: friendlyName,
          },
          driver: DRIVER,
          controls: {
            availability: {
              id: 'availability',

              title: {
                ru: 'Availability',
                en: 'Availability',
              },

              type: ControlType.TEXT,

              readonly: true,

              value: state,
            },
          },
        };

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
      }

      return;
    }

    /**
     * https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-friendly-name
     */
    logger('The device state has been received ⬇️ ⛵️ 🌍 ⬇️');

    const friendlyName = topic.replace(`${config.zigbee2mqtt.baseTopic}/`, '');
    const ieeeAddress = ieeeAddressByFriendlyName.get(friendlyName);
    const hyperionDevice = hyperionDevices.get(ieeeAddress ?? '');

    if (hyperionDevice) {
      const payload = JSON.parse(message);

      logger(
        stringify({
          topic,
          friendlyName,
          ieeeAddress,
          payload,
        }),
      );

      const { last_seen, motor_state } = payload;

      /**
       * ! Adding a field that is missing in the expose
       */
      if (typeof last_seen === 'number') {
        /**
         * ! Не нужно создавать поле если оно уже есть, новое значение будет добавлено в общем цикле
         */
        if (!hyperionDevice.controls.some(({ id }) => id === 'last_seen')) {
          const hardwareDevice: HardwareDevice = {
            id: hyperionDevice.id,
            controls: {
              last_seen: {
                id: 'last_seen',

                title: {
                  ru: 'Last seen',
                  en: 'Last seen',
                },

                type: ControlType.TEXT,

                readonly: true,

                value: String(last_seen),
              },
            },
          };

          eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
        }
      } else {
        logger('The current device does not contain the last_seen field, it must be in every device 🚨 🚨 🚨');
      }

      /**
       * ! Adding a field that is missing in the expose
       */
      if (typeof motor_state === 'string' && !hyperionDevice.controls.some(({ id }) => id === 'motor_state')) {
        /**
         * ! Не нужно создавать поле если оно уже есть, новое значение будет добавлено в общем цикле
         */

        const hardwareDevice: HardwareDevice = {
          id: hyperionDevice.id,
          controls: {
            last_seen: {
              id: 'motor_state',

              title: {
                ru: 'Motor state',
                en: 'Motor state',
              },

              type: ControlType.TEXT,

              readonly: true,

              value: String(motor_state),
            },
          },
        };

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
      }

      const fields = new Set(Object.keys(payload));

      const controls: { [key: string]: HardwareControl } = {};

      for (const control of hyperionDevice.controls) {
        if (fields.has(control.id)) {
          controls[control.id] = {
            id: control.id,
            value: payload[control.id],
          };
        }
      }

      const hardwareDevice: HardwareDevice = {
        id: hyperionDevice.id,
        controls,
      };

      eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);
    } else {
      logger('Hyperion device was not found 🚨 🚨 🚨');
      stringify({
        topic,
        friendlyName,
        ieeeAddress,
      });
    }
  });

  /**
   * ! CHANGING THE STATE OF END DEVICES
   */
  const publishMessage = ({ topic, message }: MqttMessage) => {
    publishMqttMessage({ client, topic, message });
  };

  eventBus.on(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, publishMessage);

  return {
    stop: () => {
      eventBus.off(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, publishMessage);
      eventBus.off(EventBus.HYPERION_DEVICE_APPEARED, accept);

      client.removeAllListeners();
      client.unsubscribe(`${config.zigbee2mqtt.baseTopic}/#`);
      client.end();
    },
  };
};

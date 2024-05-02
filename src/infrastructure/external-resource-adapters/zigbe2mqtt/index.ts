/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/prefer-event-target */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'node:events';

import { retry } from 'abort-controller-x';
import { compareAsc, differenceInMilliseconds, subSeconds } from 'date-fns';
import debug from 'debug';

import { ControlType } from '../../../domain/control-type';
import { EventBus } from '../../../domain/event-bus';
import { HardwareControl, HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import { isJson } from '../../../helpers/is-json';
import { stringify } from '../../../helpers/json-stringify';
import { HyperionStateUpdate, IHyperionDeviceRepository } from '../../../ports/hyperion-device-repository';
import { Config } from '../../config';
import { getMqttClient } from '../get-mqtt-client';
import { MqttMessage, publishMqttMessage } from '../publish-mqtt-message';

import { decodeAccessBitMask } from './decode-access-bit-mask';

const logger = debug('hyperion-run-zigbee2mqtt');

type RunZigbee2mqtt = {
  signal: AbortSignal;
  config: Config;
  eventBus: EventEmitter;
  hyperionDeviceRepository: IHyperionDeviceRepository;
};

type RunZigbee2mqttResult = {
  stop: () => void;
};

let lastHardwareDeviceAppeared = new Date();

let hyperionDevices = new Map<string, HyperionDevice>();
const ieeeAddressByFriendlyName = new Map<string, string>();

const accept = (hyperionState: HyperionStateUpdate) => {
  hyperionDevices = hyperionState.devices;
};

const fillIeeeAddressByFriendlyName = async (
  signal: AbortSignal,
  hyperionDeviceRepository: IHyperionDeviceRepository,
) => {
  return await retry(
    signal,
    async (signal: AbortSignal, attempt: number) => {
      if (attempt >= 10) {
        logger('Unable to get initial state of hyperion devices 🚨 🚨 🚨');

        return new Error(ErrorType.ATTEMPTS_ENDED);
      }

      logger('Try to get initial state of hyperion devices ⬇️ ⛵️ ⛵️ ⛵️ ⬇️');

      const hyperionState = await hyperionDeviceRepository.getHyperionState();

      for (const device of hyperionState.devices.values()) {
        if (device.driver === DRIVER) {
          ieeeAddressByFriendlyName.set(device.meta?.friendly_name as string, device.id);
        }
      }

      hyperionDevices = hyperionState.devices;

      logger('The initial state of hyperion devices has been obtained ⬇️ ✅ ⬇️');
    },
    {
      baseMs: 5000,
      maxAttempts: 10,
      onError(error, attempt, delayMs) {
        logger('An attempt to get initial state of hyperion devices failed 🚨');
        logger(stringify({ attempt, delayMs }));
        logger(error);
      },
    },
  );
};

const DRIVER = 'zigbee2mqtt';
/**
 *
 * ! https://www.zigbee2mqtt.io
 */
export const runZigbee2mqtt = async ({
  signal,
  config,
  eventBus,
  hyperionDeviceRepository,
}: RunZigbee2mqtt): Promise<Error | RunZigbee2mqttResult> => {
  logger('Run zigbee2mqtt converter ⛵️ ⛵️ ⛵️');

  /**
   * ! FILL ADDRESS MAP
   */
  const filledIn = await fillIeeeAddressByFriendlyName(signal, hyperionDeviceRepository);

  if (filledIn instanceof Error) {
    return filledIn;
  }

  /**
   * ! ACCEPT HYPERION DEVICES
   */
  eventBus.on(EventBus.HYPERION_STATE, accept);

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
    const isSetTopic = isBaseTopic && topic.includes('/set/');

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

    /**
     * Когда значения передаются через /set, в ответ прилетает сообщение с установленным значением.
     *
     * Можно не обрабатывать этот случай, так как после этого сообщения прилетает обновленное состояние
     * всего устройства.
     *
     * ! Если появятся случаи, когда мы не получаем состояние устройства, то придется разбирать топик,
     * ! и по полученному пути и использовать значение для обновления hyperion device.
     */
    if (!isSetTopic && !isJson(message)) {
      logger('A message was received in a non-JSON format ⬇️ 🍟 ⬇️');
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
      logger('Information about all zigbee devices has been received ⬇️ ✅ ⬇️');

      const devices = JSON.parse(message);

      for (const device of devices) {
        if (device.type === 'Coordinator') {
          logger("Skipping the coordinator's processing ⏭️");

          continue;
        }

        if (!device.supported) {
          logger('Zigbee device is not supported 🚨');
          logger(stringify(device));

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

        /**
         * Проверяем является ли expose композитным, композитные имеют поле features, если оно есть то
         * нужно вынуть все элементы из него и проверить каждый из них, если найдена ещё вложенность
         * то происходит тоже самое.
         */
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

        const controls: { [key: string]: HardwareControl } = {};

        for (const expose of exposes) {
          const { canBeSet } = decodeAccessBitMask(expose.access);

          /**
           * ! GENERAL
           */
          if (expose.type === 'binary') {
            controls[expose.path] = {
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
            };
          }

          if (expose.type === 'numeric') {
            controls[expose.path] = {
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
            };
          }

          if (expose.type === 'enum') {
            controls[expose.path] = {
              id: expose.path,

              title: {
                ru: expose.label,
                en: expose.label,
              },

              type: ControlType.ENUM,

              readonly: !canBeSet,

              enum: expose.values,

              topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
            };
          }

          if (expose.type === 'text') {
            controls[expose.path] = {
              id: expose.path,

              title: {
                ru: expose.label,
                en: expose.label,
              },

              type: ControlType.TEXT,

              readonly: !canBeSet,

              topic: canBeSet ? `${config.zigbee2mqtt.baseTopic}/${friendlyName}/set/${expose.topic}` : undefined,
            };
          }

          if (expose.type === 'list') {
            logger(
              // eslint-disable-next-line max-len
              'The list type is not being processed at the moment, it is waiting for a device that can give such a type to look at the data before implementation 🚨 🚨 🚨',
            );
          }
        }

        const hardwareDevice: HardwareDevice = {
          id: deviceId,
          title: {
            ru: friendlyName,
            en: friendlyName,
          },
          driver: DRIVER,
          meta: deviceMeta,
          controls,
        };

        // logger('The zigbee device was appeared ⛵️ ⛵️ ⛵️');
        // logger(
        //   stringify({
        //     id: hardwareDevice.id,
        //     title: hardwareDevice.title?.en,
        //     controls: Object.values(hardwareDevice.controls ?? {})
        //       .map(({ id, title }) => ({ id, title: title?.en })),
        //   }),
        // );

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);

        lastHardwareDeviceAppeared = new Date();
      }

      return;
    }

    if (isAvailabilityTopic) {
      const friendlyName = topic.replace(`${config.zigbee2mqtt.baseTopic}/`, '').replace('/availability', '');
      const ieeeAddress = ieeeAddressByFriendlyName.get(friendlyName);
      const { state } = JSON.parse(message);

      if (ieeeAddress) {
        // logger('The device availability status has been received ⬇️ 📟 🛜 ⬇️');
        // logger(stringify({ topic, state, friendlyName, ieeeAddress }));

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

              value: String(state),
            },
          },
        };

        // logger('The zigbee device was appeared ⛵️ ⛵️ ⛵️');
        // logger(
        //   stringify({
        //     id: hardwareDevice.id,
        //     title: hardwareDevice.title?.en,
        //     controls: Object.values(hardwareDevice.controls ?? {})
        //       .map(({ id, title }) => ({ id, title: title?.en })),
        //   }),
        // );

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);

        lastHardwareDeviceAppeared = new Date();
      }

      return;
    }

    if (isSetTopic) {
      const [friendlyName, controlId] = topic.replace(`${config.zigbee2mqtt.baseTopic}/`, '').split('/set/');
      const ieeeAddress = ieeeAddressByFriendlyName.get(friendlyName);
      const hyperionDevice = hyperionDevices.get(ieeeAddress ?? '');
      const payload = message;

      logger('The result of set operation on zigbee device has been received ⬇️ ⛵️ 🌍 ⬇️');
      logger(stringify({ topic, friendlyName, ieeeAddress, payload }));

      if (hyperionDevice) {
        const controls: { [key: string]: HardwareControl } = {};

        for (const control of hyperionDevice.controls) {
          if (control.id === controlId) {
            controls[control.id] = {
              id: control.id,
              value: String(payload),
            };
          }
        }

        const hardwareDevice: HardwareDevice = {
          id: hyperionDevice.id,
          controls,
        };

        logger(stringify({ topic, friendlyName, ieeeAddress, payload, hardwareDevice }));

        eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);

        lastHardwareDeviceAppeared = new Date();
      }

      return;
    }

    /**
     * https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html#zigbee2mqtt-friendly-name
     */
    logger('The zigbee device state has been received ⬇️ ⛵️ 🌍 ⬇️');

    const friendlyName = topic.replace(`${config.zigbee2mqtt.baseTopic}/`, '');
    const ieeeAddress = ieeeAddressByFriendlyName.get(friendlyName);
    const hyperionDevice = hyperionDevices.get(ieeeAddress ?? '');

    if (hyperionDevice) {
      const payload = JSON.parse(message);

      logger(stringify({ topic, friendlyName, ieeeAddress, payload }));

      const { last_seen, motor_state } = payload;

      const controls: { [key: string]: HardwareControl } = {};

      if (typeof last_seen === 'number') {
        if (!hyperionDevice.controls.some(({ id }) => id === 'last_seen')) {
          controls.last_seen = {
            id: 'last_seen',

            title: {
              ru: 'Last seen',
              en: 'Last seen',
            },

            type: ControlType.TEXT,

            readonly: true,

            value: String(last_seen),
          };
        }
      } else {
        logger('The current device does not contain the last_seen field, it must be in every device 🚨 🚨 🚨');
      }

      if (typeof motor_state === 'string' && !hyperionDevice.controls.some(({ id }) => id === 'motor_state')) {
        controls.motor_state = {
          id: 'motor_state',

          title: {
            ru: 'Motor state',
            en: 'Motor state',
          },

          type: ControlType.TEXT,

          readonly: true,

          value: String(motor_state),
        };
      }

      const fields = new Set(Object.keys(payload));

      for (const control of hyperionDevice.controls) {
        if (control.type === ControlType.ENUM) {
          controls[control.id] = fields.has(control.id)
            ? {
                id: control.id,
                value: String(payload[control.id]),
              }
            : {
                id: control.id,
                value: String(null),
              };

          continue;
        }

        if (fields.has(control.id)) {
          controls[control.id] = {
            id: control.id,
            value: String(payload[control.id]),
          };
        }
      }

      const hardwareDevice: HardwareDevice = {
        id: hyperionDevice.id,
        controls,
      };

      logger('Zigbee device has been converted to HardwareDevice 📦');
      logger(
        stringify({
          id: hardwareDevice.id,
          title: hardwareDevice.title?.en,
          controls: Object.values(hardwareDevice.controls ?? {}).map((control) => ({
            id: control.id,
            title: control.title,
            enum: control.enum,
            value: control.value,
          })),
        }),
      );

      eventBus.emit(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDevice);

      lastHardwareDeviceAppeared = new Date();
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

  const healthcheck = setInterval(() => {
    logger('Last zigbee2mqtt device was appeared at ⛵️ ⛵️ ⛵️');
    logger(
      stringify({
        isAlive: compareAsc(lastHardwareDeviceAppeared, subSeconds(new Date(), 10 * 60)) === 1,
        lastHardwareDeviceAppeared,
        diff: `${differenceInMilliseconds(new Date(), lastHardwareDeviceAppeared)} ms`,
      }),
    );
  }, 60_000);

  return {
    stop: () => {
      eventBus.off(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, publishMessage);
      eventBus.off(EventBus.HYPERION_STATE, accept);

      clearInterval(healthcheck);

      client.removeAllListeners();
      client.unsubscribe(`${config.zigbee2mqtt.baseTopic}/#`);
      client.end();

      logger('The zigbee2mqtt converter was stopped 👷‍♂️ 🛑');
    },
  };
};

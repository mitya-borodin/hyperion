import EventEmitter from 'node:events';

import { Logger } from 'pino';
import { v4 } from 'uuid';

import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
// eslint-disable-next-line max-len
import { emitGqlDeviceSubscriptionEvent } from '../../interfaces/http/graphql/helpers/emit-gql-device-subscription-event';
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { constructId } from './get-control-id';
import { Macros, MacrosAccept, MacrosType } from './macros';

export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export type LightingMacrosState = {
  forceOn: 'ON' | 'OFF' | 'UNSPECIFIED';
  switch: 'ON' | 'OFF';
};

export type LightingMacrosSettings = {
  readonly buttons: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ControlType.SWITCH;
    readonly trigger: string;
  }>;
  readonly illuminations: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ControlType.ILLUMINATION;
    readonly trigger: string;
  }>;
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ControlType.SWITCH;
    readonly level: LightingLevel;
  }>;
};

export type LightingMacrosOutput = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = {
  logger: Logger;
  eventBus: EventEmitter;
  id?: string;
  name: string;
  description: string;
  labels: string[];
  settings: LightingMacrosSettings;
};

export class LightingMacros
  implements Macros<MacrosType.LIGHTING, LightingMacrosState, LightingMacrosSettings, LightingMacrosOutput>
{
  /**
   * ! Общие зависимости всех макросов
   */
  readonly logger: Logger;
  readonly eventBus: EventEmitter;

  /**
   * ! Общие параметры всех макросов
   */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];
  readonly createdAt: Date;
  private devices: Map<string, HyperionDevice>;
  private previous: Map<string, HyperionDeviceControl>;
  private controls: Map<string, HyperionDeviceControl>;

  /**
   * ! Уникальные параметры макроса
   */
  readonly type: MacrosType.LIGHTING;
  readonly settings: LightingMacrosSettings;
  readonly state: LightingMacrosState;
  output: LightingMacrosOutput;

  constructor({ logger, eventBus, id, name, description, labels, settings }: LightingMacrosParameters) {
    /**
     * ! Общие зависимости всех макросов
     */
    this.logger = logger;
    this.eventBus = eventBus;

    /**
     * ! Общие параметры всех макросов
     */
    this.id = id ?? v4();
    this.name = name;
    this.description = description;
    this.labels = labels;
    this.createdAt = new Date();

    this.devices = new Map();
    this.previous = new Map();
    this.controls = new Map();

    /**
     * ! Уникальные параметры макроса
     */
    this.type = MacrosType.LIGHTING;
    this.settings = settings;
    this.state = {
      forceOn: 'UNSPECIFIED',
      switch: 'OFF',
    };
    this.output = {
      lightings: [],
    };
  }

  setState = (state: LightingMacrosState): void => {
    switch (state.forceOn) {
      case 'ON': {
        this.state.forceOn = 'ON';

        this.execute();

        break;
      }
      case 'OFF': {
        this.state.forceOn = 'OFF';

        this.execute();

        break;
      }
      case 'UNSPECIFIED': {
        this.state.forceOn = 'UNSPECIFIED';

        this.execute();

        break;
      }
      default: {
        this.logger.error({ state }, 'An incorrect state was received 🚨');
      }
    }
  };

  accept = ({ devices, previous, controls }: MacrosAccept): void => {
    this.devices = devices;
    this.previous = previous;
    this.controls = controls;

    this.execute();
  };

  private execute = () => {
    /**
     * ! FORCE ON LOGIC
     */
    if (this.state.forceOn !== 'UNSPECIFIED') {
      let value = '0';

      if (this.state.forceOn === 'ON') {
        this.state.switch = 'ON';

        value = '1';
      }

      if (this.state.forceOn === 'OFF') {
        this.state.switch = 'OFF';

        value = '0';
      }

      this.collectOutput(value);
      this.sendMessages();

      return;
    }

    /**
     * ! BUTTON PRESS LOGIC
     */
    if (this.hasButtonPress()) {
      /**
       * ! Использовать this.settings.illuminations, для включения подходящей зоны света:
       * ! основной, средний, низкий.
       */
      if (this.state.switch === 'ON') {
        this.state.switch = 'OFF';

        this.collectOutput('0');
      }

      if (this.state.switch === 'OFF') {
        this.state.switch = 'ON';

        this.collectOutput('1');
      }

      this.sendMessages();
    }
  };

  private hasButtonPress = (): boolean => {
    for (const button of this.settings.buttons) {
      const id = constructId({ deviceId: button.deviceId, controlId: button.controlId });

      const previous = this.previous.get(id);
      const control = this.controls.get(id);

      if (!previous || !control) {
        return false;
      }

      if (previous.value !== control.value && control.value === '1') {
        return true;
      }
    }

    return false;
  };

  private collectOutput = (value: string) => {
    const output: LightingMacrosOutput = {
      lightings: [],
    };

    for (const { deviceId, controlId, type } of this.settings.lightings) {
      const control = this.controls.get(constructId({ deviceId, controlId }));

      if (!control) {
        this.logger.warn(
          { deviceId, controlId, type, controls: this.controls.size },
          'The control specified in the settings was not found 🚨',
        );

        continue;
      }

      if (control.type !== type) {
        this.logger.error(
          { deviceId, controlId, type, controls: this.controls.size, control },
          'Unsuitable control found 🚨',
        );

        continue;
      }

      if (!control.topic) {
        this.logger.error(
          { deviceId, controlId, type, controls: this.controls.size, control },
          'The control does not contain a topic 🚨',
        );

        continue;
      }

      /**
       * ! Если не проверять на эквивалентность value, то когда WB вернет измененное состояние устройства
       * ! мы снова отправим сообщение, и WB нам его вернет как новое состояние, то мы попадем в рекурсию.
       *
       * ! Не известно проверяет ли на это WB, скорее всего да, но нам не помешает проверить это самим.
       */
      if (control.value !== value) {
        output.lightings.push({
          deviceId,
          controlId,
          value,
        });
      }
    }

    this.output = output;
  };

  private sendMessages = () => {
    for (const lighting of this.output.lightings) {
      const hyperionDevice = this.devices.get(lighting.deviceId);
      const hyperionControl = this.controls.get(
        constructId({ deviceId: lighting.deviceId, controlId: lighting.controlId }),
      );

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        this.logger.error(
          { lighting, hyperionDevice, hyperionControl, topic: hyperionControl?.topic },
          'Incorrect data for sending messages 🚨',
        );

        continue;
      }

      /**
       * ! Отправка сообщений непосредственно из макроса, может привести к гонке состояний.
       * ! Возможно в дальнейшем, мы сделаем отдельную службу которая будет выбирать в какое состояние
       * ! переключиться в зависимости от тех или иных параметров в состоянии макросов.
       */
      emitWirenboardMessage({ eventBus: this.eventBus, topic: hyperionControl.topic, message: lighting.value });
      emitGqlDeviceSubscriptionEvent({ eventBus: this.eventBus, hyperionDevice });
    }
  };
}

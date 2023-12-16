import EventEmitter from 'node:events';

import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import { v4 } from 'uuid';

import { ErrorType } from '../../helpers/error-type';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
// eslint-disable-next-line max-len
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { Macros, MacrosAccept, MacrosType } from './macros';

const logger = debug('lighting-macros');

export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export enum LightingForce {
  ON = 'ON',
  OFF = 'OFF',
  UNSPECIFIED = 'UNSPECIFIED',
}

export type LightingMacrosPublicState = {
  force: LightingForce;
};

export type LightingMacrosPrivateState = {
  switch: 'ON' | 'OFF';
};

type LightingMacrosState = LightingMacrosPublicState & LightingMacrosPrivateState;

export type LightingMacrosSettings = {
  readonly buttons: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly trigger: string;
  }>;
  readonly illuminations: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly trigger: string;
  }>;
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly level: LightingLevel;
  }>;
};

type LightingMacrosNextControlState = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = {
  eventBus: EventEmitter;
  id?: string;
  name: string;
  description: string;
  labels: string[];
  settings: LightingMacrosSettings;
  state: LightingMacrosPublicState;

  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
};

export class LightingMacros implements Macros<MacrosType.LIGHTING, LightingMacrosState, LightingMacrosSettings> {
  /**
   * ! Общие зависимости всех макросов
   */
  readonly eventBus: EventEmitter;

  /**
   * ! Данные устройств
   */
  private devices: Map<string, HyperionDevice>;
  private previous: Map<string, HyperionDeviceControl>;
  private controls: Map<string, HyperionDeviceControl>;

  /**
   * ! Общие параметры всех макросов
   */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];

  /**
   * ! Уникальные параметры макроса
   */
  readonly type: MacrosType.LIGHTING;
  readonly settings: LightingMacrosSettings;
  readonly state: LightingMacrosState;

  /**
   * ! Следующее состояние контролов находящихся под управлением
   */
  private nextControlState: LightingMacrosNextControlState;

  constructor({
    eventBus,
    devices,
    controls,
    id,
    name,
    description,
    labels,
    state,
    settings,
  }: LightingMacrosParameters) {
    /**
     * ! Общие зависимости всех макросов
     */
    this.eventBus = eventBus;

    /**
     * ! Данные устройств
     */
    this.devices = cloneDeep(devices);
    this.previous = new Map();
    this.controls = cloneDeep(controls);

    /**
     * ! Общие параметры всех макросов
     */
    this.id = id ?? v4();
    this.name = name;
    this.description = description;
    this.labels = labels;

    /**
     * ! Уникальные параметры макроса
     */
    this.type = MacrosType.LIGHTING;
    this.settings = settings;
    this.state = {
      force: state.force,
      switch: 'OFF',
    };

    /**
     * ! Следующее состояние контролов находящихся под управлением
     */
    this.nextControlState = {
      lightings: [],
    };

    /**
     * ! Проверка на наличие и соответствие типам.
     */
    for (const setting of this.settings.buttons) {
      const button = this.controls.get(getControlId(setting));

      if (!button) {
        logger('Button control not found 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }

      if (button.type !== ControlType.SWITCH) {
        logger('Button control is not SWITCH 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.illuminations) {
      const illumination = this.controls.get(getControlId(setting));

      if (!illumination) {
        logger('Illumination control not found 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }

      if (illumination.type !== ControlType.ILLUMINATION) {
        logger('Illumination control is not ILLUMINATION 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.lightings) {
      const lighting = this.controls.get(getControlId(setting));

      if (!lighting) {
        logger('Illumination control not found 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }

      if (lighting.type !== ControlType.SWITCH) {
        logger('Illumination control is not SWITCH 🚨');
        logger(JSON.stringify({ setting }, null, 2));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }
  }

  toJS = () => {
    return cloneDeep({
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      labels: this.labels,
      settings: this.settings,
      state: this.state,
    });
  };

  setState = (state: LightingMacrosPublicState): void => {
    switch (state.force) {
      case LightingForce.ON: {
        this.state.force = LightingForce.ON;

        break;
      }
      case LightingForce.OFF: {
        this.state.force = LightingForce.OFF;

        break;
      }
      case LightingForce.UNSPECIFIED: {
        this.state.force = LightingForce.UNSPECIFIED;

        break;
      }
      default: {
        logger('An incorrect state was received 🚨');
        logger(JSON.stringify({ state }, null, 2));

        return;
      }
    }

    this.execute();
  };

  accept = ({ devices, previous, controls, device }: MacrosAccept): void => {
    this.devices = devices;
    this.previous = previous;
    this.controls = controls;

    if (this.isNeedToExecute(device)) {
      this.execute();
    }
  };

  private isNeedToExecute = (device: HyperionDevice) => {
    for (const control of device.controls) {
      const button = this.settings.buttons.find(
        (button) => button.deviceId === device.id && button.controlId === control.id,
      );
      const lighting = this.settings.lightings.find(
        (lighting) => lighting.deviceId === device.id && lighting.controlId === control.id,
      );

      if (button || lighting) {
        return true;
      }
    }

    return false;
  };

  private hasButtonPress = (): boolean => {
    return this.settings.buttons.some((button) => {
      const id = getControlId({ deviceId: button.deviceId, controlId: button.controlId });

      const previous = this.previous.get(id);
      const control = this.controls.get(id);

      if (!previous || !control) {
        return false;
      }

      if (previous.value !== control.value && control.value === '1') {
        return true;
      }

      return false;
    });
  };

  private execute = () => {
    logger('Execute lighting macros 🚀 👷‍♂️ ⏭️');

    /**
     * ! FORCE ON LOGIC
     */
    if (this.state.force !== 'UNSPECIFIED') {
      let value = '0';

      if (this.state.force === 'ON') {
        this.state.switch = 'ON';

        value = '1';
      }

      if (this.state.force === 'OFF') {
        this.state.switch = 'OFF';

        value = '0';
      }

      logger('The forced state was determined 🫡 😡');
      logger(JSON.stringify({ state: this.state, value }, null, 2));

      this.computeNextControlState(value);
      this.sendMessages();

      return;
    }

    /**
     * ! BUTTON PRESS LOGIC
     */
    if (this.hasButtonPress()) {
      logger('Button was pressed 🧯');
      logger(JSON.stringify({ state: this.state }, null, 2));

      /**
       * ! Использовать this.settings.illuminations, для включения подходящей зоны света:
       * ! основной, средний, низкий.
       */
      if (this.state.switch === 'ON') {
        this.state.switch = 'OFF';

        this.computeNextControlState('0');

        logger('Next state will be 🧯');
        logger(JSON.stringify({ nextState: this.state, nextControlState: this.nextControlState }, null, 2));

        this.sendMessages();

        return;
      }

      if (this.state.switch === 'OFF') {
        this.state.switch = 'ON';

        this.computeNextControlState('1');

        logger('Next state will be 🧯');
        logger(JSON.stringify({ nextState: this.state, nextControlState: this.nextControlState }, null, 2));

        this.sendMessages();

        return;
      }
    }

    /**
     * ! CHECK OUTPUT CONTROL STATE
     */
    this.checkOutputControlState();
  };

  private checkOutputControlState = () => {
    const isOn = this.settings.lightings.every((lighting) => {
      const id = getControlId({ deviceId: lighting.deviceId, controlId: lighting.controlId });

      const control = this.controls.get(id);

      if (control) {
        return control.value === '1';
      }

      return false;
    });

    const nextState = isOn ? 'ON' : 'OFF';

    if (this.state.switch !== nextState) {
      this.state.switch = isOn ? 'ON' : 'OFF';

      logger('The internal state has been changed because all managed controls have changed state 👷‍♂️ 🍋 🧯');
      logger(JSON.stringify({ state: this.state }, null, 2));
    }
  };

  private computeNextControlState = (value: string) => {
    const nextControlState: LightingMacrosNextControlState = {
      lightings: [],
    };

    for (const { deviceId, controlId } of this.settings.lightings) {
      const type = ControlType.SWITCH;

      const control = this.controls.get(getControlId({ deviceId, controlId }));

      if (!control) {
        logger('The control specified in the settings was not found 🚨');
        logger(JSON.stringify({ deviceId, controlId, controls: [...this.controls.values()] }, null, 2));

        continue;
      }

      if (control.type !== type) {
        logger('The type of control does not match the settings 🚨');
        logger(JSON.stringify({ deviceId, controlId, type, control, controls: [...this.controls.values()] }, null, 2));

        continue;
      }

      if (!control.topic) {
        logger('The control object does not contain a topic for sending messages 🚨');
        logger(JSON.stringify({ deviceId, controlId, type, control, controls: [...this.controls.values()] }, null, 2));

        continue;
      }

      /**
       * ! Если не проверять на эквивалентность value, то когда WB вернет измененное состояние устройства
       * ! мы снова отправим сообщение, и WB нам его вернет как новое состояние, то мы попадем в рекурсию.
       *
       * ! Не известно проверяет ли на это WB, скорее всего да, но нам не помешает проверить это самим.
       */
      if (control.value !== value) {
        nextControlState.lightings.push({
          deviceId,
          controlId,
          value,
        });
      }
    }

    this.nextControlState = nextControlState;
  };

  private sendMessages = () => {
    for (const lighting of this.nextControlState.lightings) {
      const hyperionDevice = this.devices.get(lighting.deviceId);
      const hyperionControl = this.controls.get(
        getControlId({ deviceId: lighting.deviceId, controlId: lighting.controlId }),
      );

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        logger('Incorrect data for sending messages 🚨');
        logger(JSON.stringify({ lighting, hyperionDevice, hyperionControl, topic: hyperionControl?.topic }, null, 2));

        continue;
      }

      /**
       * ! Отправка сообщений непосредственно из макроса, может привести к гонке состояний.
       * ! Возможно в дальнейшем, мы сделаем отдельную службу которая будет выбирать в какое состояние
       * ! переключиться в зависимости от тех или иных параметров в состоянии макросов.
       */
      const { topic } = hyperionControl;
      const message = lighting.value;

      logger('A message will be sent to the WB 🚀 👷‍♂️ 🍟');
      logger(JSON.stringify({ topic, message }, null, 2));

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }
  };
}

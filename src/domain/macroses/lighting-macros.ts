import EventEmitter from 'node:events';

import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import { v4 } from 'uuid';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
// eslint-disable-next-line max-len
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { Macros, MacrosAccept, MacrosType } from './macros';

const logger = debug('hyperion-hyperion-lighting-macros');

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

      if (!button || button.type !== ControlType.SWITCH) {
        logger('Button control not found or is not SWITCH 🚨');
        logger(stringify({ name: this.name, setting, button }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.illuminations) {
      const illumination = this.controls.get(getControlId(setting));

      if (!illumination || illumination.type !== ControlType.ILLUMINATION) {
        logger('Illumination control not found or is not ILLUMINATION 🚨');
        logger(stringify({ name: this.name, setting, illumination }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.lightings) {
      const lighting = this.controls.get(getControlId(setting));

      if (!lighting || lighting.type !== ControlType.SWITCH) {
        logger('Illumination control not found or is not SWITCH 🚨');
        logger(stringify({ name: this.name, setting, lighting }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    /**
     * ! Ждем 250 мс, между появлением сообщений от контроллера.
     */
    this.updateStateByOutputControls = debounce(this.updateStateByOutputControls.bind(this), 250, {
      leading: false,
      trailing: true,
    });
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
        logger(stringify({ name: this.name, state }));

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
    /**
     * ! UPDATE STATE BY FORCE
     */
    let canGoForward = this.updateStateByForceState();

    if (!canGoForward) {
      return;
    }

    /**
     * ! UPDATE STATE BY BUTTON PRESS
     */
    canGoForward = this.updateStateByButtonPress();

    if (!canGoForward) {
      return;
    }

    /**
     * ! UPDATE STATE BY OUTPUT CONTROLS
     */
    this.updateStateByOutputControls();
  };

  private updateStateByForceState = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.force === 'ON') {
        nextSwitchState = 'ON';
        nextValue = '1';
      }

      if (this.state.force === 'OFF') {
        nextSwitchState = 'OFF';
        nextValue = '0';
      }

      this.computeNextControlState(nextValue);

      if (this.nextControlState.lightings.length > 0) {
        logger('The forced state was determined 🫡 😡');
        logger(
          stringify({
            name: this.name,
            currentState: this.state,
            nextSwitchState,
            nextValue,
            nextControlState: this.nextControlState,
          }),
        );

        this.state.switch = nextSwitchState;

        this.sendMessages();
      }

      return false;
    }

    return true;
  };

  private updateStateByButtonPress = () => {
    if (this.hasButtonPress()) {
      logger('Button was pressed ⬇️');
      logger(stringify({ name: this.name, currentState: this.state }));

      /**
       * ! Использование this.settings.illuminations будет актуально когда нужно будет выбирать уровень группы света:
       * ! основной, средний, низкий.
       */
      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.switch === 'ON') {
        /**
         * ! Если хотя бы один контрол из группы включен, то при первом клике, нужно включить все остальные, а
         * ! при втором клике все выключаем.
         */
        const everyOn = this.settings.lightings.every((lighting) => {
          return this.controls.get(getControlId(lighting))?.value === '1';
        });

        if (everyOn) {
          nextSwitchState = 'OFF';
          nextValue = '0';
        } else {
          nextSwitchState = 'ON';
          nextValue = '1';
        }
      } else if (this.state.switch === 'OFF') {
        nextSwitchState = 'ON';
        nextValue = '1';
      } else {
        logger('No handler found for the current state 🚨');
        logger(stringify({ name: this.name, currentState: this.state }));

        nextSwitchState = 'OFF';
        nextValue = '0';
      }

      this.state.switch = nextSwitchState;

      this.computeNextControlState(nextValue);
      this.sendMessages();

      return false;
    }

    return true;
  };

  /**
   * * Определение состояния, по данным контроллера.
   * * Нужно тротлить вызовы в диапазоне 100 - 500мс, для того, чтобы не видеть промежуточные состояния.
   * * Часто промежуточные состояния видно в процессе выключения контролов, так как мы отправляем несколько
   * * сообщение с value="0", и получаем сообщения от контроллера, что контрол переключился в состояние "0",
   * * но у нас в моменте остались контролы в состоянии "1", мы переключаемся обратно в состояние "1", и
   * * получается мы с агрились на промежуточное состояние.
   *
   * ! Процедура полезна в случаях:
   * ! 1. Запуск процесса.
   * ! 2. Изменение состояния контроллера другим макросом.
   * ! 3. Изменение состояния контроллера прочими способами.
   */
  private updateStateByOutputControls() {
    const isSomeOn = this.settings.lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      if (control) {
        return control.value === '1';
      }

      return false;
    });

    const nextState = isSomeOn ? 'ON' : 'OFF';

    const loggerContext = stringify({
      name: this.name,
      currentState: this.state,
      lightings: this.settings.lightings.map((lighting) => {
        return {
          value: this.controls.get(getControlId(lighting))?.value,
        };
      }),
      isSomeOn,
      nextState,
    });

    if (this.state.switch === nextState) {
      logger('The state of the macro corresponds to the state of the controller ✅');
      logger(loggerContext);

      return;
    }

    logger('The internal state has been changed because one of the managed controls has changed state 🍋');
    logger(loggerContext);

    this.state.switch = nextState;
  }

  private computeNextControlState = (value: string) => {
    const nextControlState: LightingMacrosNextControlState = {
      lightings: [],
    };

    for (const { deviceId, controlId } of this.settings.lightings) {
      const type = ControlType.SWITCH;

      const control = this.controls.get(getControlId({ deviceId, controlId }));

      if (!control || control.type !== type || !control.topic) {
        logger('The control specified in the settings was not found, or matches the parameters 🚨');
        logger(
          stringify({
            name: this.name,
            deviceId,
            controlId,
            type,
            controls: [...this.controls.values()],
          }),
        );

        continue;
      }

      /**
       * * Избавляемся от гипотетической рекурсии
       *
       * ! Если не проверять на эквивалентность value, то когда WB вернет измененное состояние устройства
       * ! мы снова отправим сообщение, и WB нам его вернет как новое состояние, то мы попадем в рекурсию.
       *
       * * Реализуем возможность запуска force режима
       *
       * ! Так же эта проверка позволяет понять, отличается ли текущее состояние, от того, которое требуется.
       * ! Исходя из этой информации удобно делать force режим, если список пустой, то не нужно применять настройки
       * ! force режима, так как прошлое изменение эти настройки были применены.
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

    logger('The next state was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextControlState: this.nextControlState,
      }),
    );
  };

  private sendMessages = () => {
    for (const lighting of this.nextControlState.lightings) {
      const hyperionDevice = this.devices.get(lighting.deviceId);

      const controlId = getControlId({ deviceId: lighting.deviceId, controlId: lighting.controlId });

      const hyperionControl = this.controls.get(controlId);

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        logger(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger(
          stringify({
            name: this.name,
            lighting,
            hyperionDevice,
            controlId,
            hyperionControl,
            topic: hyperionControl?.topic,
          }),
        );

        continue;
      }

      /**
       * ! Отправка сообщений непосредственно из макроса, может привести к гонке состояний.
       * ! Возможно в дальнейшем, мы сделаем отдельную службу которая будет выбирать в какое состояние
       * ! переключиться в зависимости от тех или иных параметров в состоянии макросов.
       */
      const { topic } = hyperionControl;
      const message = lighting.value;

      logger('The message has been created and will be sent to the wirenboard controller ✅ 🚀');
      logger(
        stringify({
          name: this.name,
          topic,
          message,
        }),
      );

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }
  };
}

/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:boiler');

/**
 * ! Boiler macros scenarios
 *
 * Макрос реализует возможность параллельной загрузки бойлера,
 *  параллельной относительно отопления и вентиляции.
 */

/**
 * ! SETTINGS
 */

/**
 * Состояние устройств.
 */
export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Перечень настроек которые требуются для создания экземпляра макроса.
 */
export type BoilerMacrosSettings = {
  /**
   * Датчик температуры.
   */
  readonly temperature: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.TEMPERATURE;
  };

  /**
   * Насос загрузки.
   */
  readonly pump: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  };

  /**
   * Уникальный идентификатор источника тепла.
   *
   * Устройства с подходящим контролом виртуальное и появляется запущен макрос источник тепла.
   */
  readonly heat: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.HEAT_SOURCE;
  }>;
};

/**
 * ! STATE
 */
export type BoilerMacrosPublicState = {
  /**
   * Уставка, до какой температуры греть горячую воду.
   *
   * Если уставка меньше 60, то раз в 6 часов, вода будет нагрета до 60.
   * Если уставка больше 75 градусов то вода будет нагреваться до 75 градусов.
   *
   * Диапазон значений 40 - 75 градусов.
   */
  temperatureTarget: number;
};

export type BoilerMacrosPrivateState = {
  /**
   * Текущая температура.
   */
  temperature: number;

  /**
   * Состояние работы насоса.
   */
  pump: DeviceState;
};

type BoilerMacrosState = BoilerMacrosPublicState & BoilerMacrosPrivateState;

const defaultState: BoilerMacrosState = {
  temperatureTarget: 60,
  temperature: 60,
  pump: DeviceState.OFF,
};

const createDefaultState = () => cloneDeep(defaultState);

/**
 * ! OUTPUT
 */
type BoilerMacrosNextOutput = {
  pump?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  };
  heat: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.HEAT_SOURCE;
    readonly value: number;
  }>;
};

/**
 * Версия макроса, к версии привязана схеме настроек, состояния и их валидация при запуске,
 *  так же к схеме привязаны миграции схем при запуске.
 */
const VERSION = 0;

/**
 * ! CONSTRUCTOR PARAMS
 */
type BoilerMacrosParameters = MacrosParameters<string, string | undefined>;

export class BoilerMacros extends Macros<MacrosType.BOILER, BoilerMacrosSettings, BoilerMacrosState> {
  private nextOutput: BoilerMacrosNextOutput;

  constructor(parameters: BoilerMacrosParameters) {
    const settings = BoilerMacros.parseSettings(parameters.settings, parameters.version);
    const state = BoilerMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.BOILER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, createDefaultState()),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      pump: undefined,
      heat: [],
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): BoilerMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): BoilerMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): BoilerMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicState: string): void => {};

  protected collecting() {}

  protected priorityComputation = () => {
    return false;
  };

  protected actionBasedComputing = (): boolean => {
    return false;
  };
  protected sensorBasedComputing = (): boolean => {
    return false;
  };

  protected computeOutput = () => {
    const nextOutput: BoilerMacrosNextOutput = {
      pump: undefined,
      heat: [],
    };

    this.nextOutput = nextOutput;

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  };

  protected send = () => {};

  protected destroy() {}

  /**
   * ! INTERNAL_IMPLEMENTATION
   */
}

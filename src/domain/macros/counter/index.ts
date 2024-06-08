import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:counter');
/**
 * ! SETTINGS
 */
/**
 * Тип счетчика, по типу уже определяется единица измерения и поведение.
 */
export enum CounterType {
  UNSPECIFIED = 'UNSPECIFIED',

  /**
   * Учет холодной воды, в кубических метрах.
   */
  COLD_WATER = 'COLD_WATER',

  /**
   * Учет горячей воды, в кубических метрах.
   */
  HOT_WATER = 'HOT_WATER',

  /**
   * Учет газа, в кубических метрах.
   */
  GAS = 'GAS',

  /**
   * Учет электричества, в кило ватах в час.
   */
  ELECTRICITY = 'ELECTRICITY',

  /**
   * Учет тепла, в кило ватах в час.
   */
  HEAT = 'HEAT',

  /**
   * Учет времени когда реле во включенном состоянии, в секундах.
   */
  RELAY_ON = 'RELAY_ON',

  /**
   * Учет времени когда реле в выключенном состоянии, в секундах.
   */
  RELAY_OFF = 'RELAY_OFF',

  /**
   * Учет количества переключений, в разах.
   */
  SWITCH = 'SWITCH',
}

export enum UnitOfMeasurement {
  UNSPECIFIED = 'UNSPECIFIED',

  /**
   * Объем.
   */
  VOLUME = 'm^3',

  /**
   * Мощность.
   */
  POWER = 'kW/h',

  /**
   * Время работы.
   */
  WORK_TIME = 'sec',

  /**
   * Количество раз.
   */
  TIMES = 'times',
}

export enum CounterTrigger {
  /**
   * Реакция только на замкнутый контакт, после разомкнутого.
   */
  FRONT = 'FRONT',

  /**
   * Реакция только на разомкнутый контакт, после замкнутого.
   */
  BACK = 'BACK',

  /**
   * Реакция только на изменение состояния контакта.
   */
  BOTH = 'BOTH',
}

/**
 * Импульсный счетчик
 * воды,
 * газа,
 * электричества,
 * тепла,
 * количества (верхних, нижних) уровней на переключателях,
 * время работы и/или простоя реле.
 */
export type CounterMacrosSettings = {
  readonly devices: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  };

  readonly properties: {
    readonly type: CounterType;
    readonly trigger: CounterTrigger;
    readonly price: number;
  };
};

/**
 * ! STATE
 */
export type CounterMacrosPublicState = {
  value: number;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type CounterMacrosPrivateState = {};

type CounterMacrosState = CounterMacrosPublicState & CounterMacrosPrivateState;

/**
 * ! OUTPUT
 */
type CounterMacrosNextOutput = {
  readonly value: number;
  readonly unitOfMeasurement: UnitOfMeasurement;
};

const VERSION = 0;

type CounterMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: CounterMacrosState = {
  value: 0,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class CounterMacros extends Macros<MacrosType.COUNTER, CounterMacrosSettings, CounterMacrosState> {
  private output: CounterMacrosNextOutput;

  constructor(parameters: CounterMacrosParameters) {
    const settings = CounterMacros.parseSettings(parameters.settings, parameters.version);
    const state = CounterMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.COUNTER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, { value: 0 }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.output = {
      value: 0,
      unitOfMeasurement: UnitOfMeasurement.UNSPECIFIED,
    };
  }

  private getDebugContext = (mixin = {}) => {
    return {
      name: this.name,
      now: this.now,
      state: this.state,
      mixin,
      output: this.output,
    };
  };

  static parseSettings = (settings: string, version: number = VERSION): CounterMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): CounterMacrosState => {
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
    const output: CounterMacrosNextOutput = {
      value: 0,
      unitOfMeasurement: UnitOfMeasurement.UNSPECIFIED,
    };

    this.output = output;

    logger.info('The next output was computed 🍋');
    logger.debug(this.getDebugContext());
  };

  protected send = () => {};

  protected destroy() {}
}

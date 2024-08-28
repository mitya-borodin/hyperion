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
  /**
   * Учет количества импульсов.
   *
   * Значение по умолчанию.
   * Не учитывает ничего кроме как количество импульсов.
   */
  IMPULSE_COUNT = 'IMPULSE_COUNT',

  /**
   * Учет количества рабочих часов, при выборе этого типа счетчика
   * Trigger может быть либо FRONT либо BACK, если выбрать BOTH, то
   * работать будет как FRONT.
   */
  WORK_TIME = 'WORK_TIME',

  /**
   * Учет электричества, в кило ватах в час.
   */
  ELECTRICITY = 'ELECTRICITY',

  /**
   * Учет газа, в кубических метрах.
   */
  GAS = 'GAS',

  /**
   * Учет тепла, в кило ватах в час.
   */
  HEAT = 'HEAT',

  /**
   * Учет холодной воды, в кубических метрах.
   */
  COLD_WATER = 'COLD_WATER',

  /**
   * Учет горячей воды, в кубических метрах.
   */
  HOT_WATER = 'HOT_WATER',
}

export enum UnitOfMeasurement {
  /**
   * Количество импульсов.
   *
   * Значение по умолчанию.
   */
  IMPULSE = 'impulse',

  /**
   * Время работы, сумма временных отрезков, от включения
   * реле до выключения.
   */
  WORK = 'sec',

  /**
   * Объем.
   */
  VOLUME = 'm^3',

  /**
   * Мощность.
   */
  POWER = 'kW/h',
}

/**
 * Типа реакции.
 */
export enum Trigger {
  /**
   * Реакция только на замкнутый контакт, после разомкнутого.
   */
  FRONT = 'FRONT',

  /**
   * Реакция только на разомкнутый контакт, после замкнутого.
   */
  BACK = 'BACK',

  /**
   * Реакция на изменение состояния контакта.
   *
   * Значение по умолчанию.
   */
  BOTH = 'BOTH',
}

/**
 * Импульсный счетчик
 *
 * Различные приборы учета имею импульсный выход который работает как ключ который при
 * прохождение определенного количества ресурса через прибор учета то замыкает то размыкает ключ
 * можно считать только замыкания или только размыкания или и то и то, для учета импульсов,
 * которые в последствии умножаются на цену одно импульса которая берется из документации к прибору.
 *
 * Отслеживая частоту (время между переключениями) переключений можно понять скорость расхода ресурса, а
 * посчитав количество переключений можно понять объем расхода ресурса,
 * отслеживая включенное состояние можно посчитать моточасы устройств подключенных через реле.
 *
 * Макрос импульсного счетчика может учитывать:
 * - Количество импульсов (считается вне зависимости от выбранного типа ресурса)
 * - Моточасы или время нахождения переключателя в указанном положении
 * - Электричество
 * - Газ
 * - Тепло
 * - Воду
 */
export type CounterMacrosSettings = {
  readonly devices: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  };

  readonly properties: {
    readonly type: CounterType;
    readonly trigger: Trigger;
    readonly initOfMeasurement: UnitOfMeasurement;

    /**
     * Стоимость одного импульса.
     *
     * По умолчанию 0, ресурс не будет учитываться, будет учитываться
     * только количество переключений и время проведенное в каждом положении.
     */
    readonly cost: number;
  };
};

/**
 * ! STATE
 */
/**
 * Публичное состояние счетчика, на которое пользователь может влиять.
 */
export type CounterMacrosPublicState = {
  /**
   * Значение в единицах измерения, которое пользователь может задать, чтобы синхронизовать значение
   * прибора учета и макроса.
   */
  readonly amount: number;
};

/**
 * Внутренне состояние счетчика, на которое пользователь НЕ может влиять.
 */
type CounterMacrosPrivateState = {
  /**
   * Количество импульсов.
   */
  impulse: number;

  /**
   * Количество секунд засчитанных как рабочее время устройства подключенного к реле.
   *
   * Моточасы учитываются только для CounterType => RELAY_SWITCH_COUNT
   */
  workSec: number;
};

type CounterMacrosState = CounterMacrosPublicState & CounterMacrosPrivateState;

/**
 * ! OUTPUT
 */
type CounterMacrosNextOutput = {
  /**
   * Количество импульсов.
   */
  readonly impulse: number;

  /**
   * Моточасы, > 0 будет только в случае CounterType => RELAY_SWITCH_COUNT.
   */
  readonly workSec: number;

  /**
   * Значение в единицах измерения, impulse * properties.cost.
   */
  readonly amount: number;

  /**
   * Единица измерения счетчика.
   */
  readonly unitOfMeasurement: UnitOfMeasurement;
};

const VERSION = 0;

type CounterMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: CounterMacrosState = {
  impulse: 0,
  workSec: 0,
  amount: 0,
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
      impulse: -1,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.IMPULSE,
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
      impulse: -1,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.IMPULSE,
    };

    this.output = output;

    logger.info('The next output was computed 🍋');
    logger.debug(this.getDebugContext());
  };

  protected send = () => {};

  protected destroy() {}
}

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
   */
  IMPULSE_COUNT = 'IMPULSE_COUNT',

  /**
   * Учет количества переключения реле.
   */
  RELAY_SWITCH_COUNT = 'RELAY_SWITCH_COUNT',

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
   * Количество переключений.
   *
   * Значение по умолчанию.
   */
  SWITCHES = 'switches',

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
   * Значение по умолчанию, для всех типов CounterType кроме RELAY_SWITCH_COUNT
   * для RELAY_SWITCH_COUNT значение по умолчанию будет FRONT.
   */
  BOTH = 'BOTH',
}

/**
 * Импульсный счетчик
 *
 * Это устройство которое работает как ключ который при прохождение определенного
 * количества ресурса через прибор учета то замыкается то размыкается.
 *
 * Отслеживая частоту включений-выключений можно понять скорость расхода ресурса,
 * посчитав количество переключений можно понять объем расхода ресурса,
 * отслеживая включенное состояние можно посчитать моточасы устройств подключенных через реле.
 *
 * Макрос импульсного счетчика может учитывать:
 * - Количество импульсов (считается вне зависимости от выбранного типа ресурса)
 * - Моточасы или время нахождения переключателя в указанном положении (считается независимо от выбранного типа ресурса)
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
    readonly price: number;
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
  counter: number;

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
  readonly counter: number;

  /**
   * Моточасы, > 0 будет только в случае CounterType => RELAY_SWITCH_COUNT.
   */
  readonly workSec: number;

  /**
   * Значение в единицах измерения.
   */
  readonly amount: number;
  readonly unitOfMeasurement: UnitOfMeasurement;
};

const VERSION = 0;

type CounterMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: CounterMacrosState = {
  counter: 0,
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
      counter: -1,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.SWITCHES,
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
      counter: -1,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.SWITCHES,
    };

    this.output = output;

    logger.info('The next output was computed 🍋');
    logger.debug(this.getDebugContext());
  };

  protected send = () => {};

  protected destroy() {}
}

import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:counter');

/**
 * ! Impulse counter macros scenarios
 *
 * Прибор учета - это физическое устройство, которое позволяет считать "импульсы",
 *  то есть имеет импульсный выход (кабель с двумя проводами).
 *
 * Импульс - абстракция которая реализуется через ключ, который последовательно замыкается и размыкается,
 *  в процессе работы прибора учета.
 *
 * Импульсный счетчик - это программное обеспечение, которое позволяет считать количество импульсов и на основе
 *  количества и частоты появления импульсов вычислять объем и скорость расхода ресурсов,
 *  которые учитывает прибор учета.
 *
 * Макрос импульсного счетчика может учитывать:
 * - Количество импульсов (считается вне зависимости от выбранного типа ресурса)
 * - Скорость расхода ресурса (считается для всего кроме WORK_TIME)
 * - Моточасы или время нахождения переключателя в указанном положении (считается только для WORK_TIME)
 * - Электричество
 * - Газ
 * - Тепло
 * - Воду
 */

/**
 * ! SETTINGS
 */

/**
 * Тип счетчика, по типу определяется поведение и единицы измерения.
 */
export enum CounterType {
  /**
   * Учет количества импульсов.
   *
   * Значение по умолчанию.
   *
   * Не учитывает ничего кроме как количество импульсов и скорость появления импульсов.
   */
  IMPULSE_COUNT = 'IMPULSE_COUNT',

  /**
   * Учет количества рабочих часов, при выборе этого типа счетчика
   *  Trigger может быть либо FRONT либо BACK, если выбрать BOTH, то
   *  работать будет как FRONT.
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

/**
 * Единицы измерения
 */
export enum UnitOfMeasurement {
  /**
   * Количество импульсов.
   *
   * Значение по умолчанию.
   */
  IMPULSE = 'impulse',

  /**
   * Время работы, сумма временных отрезков, от включения
   *  реле до выключения.
   *
   * Включение определяется по значению Trigger, если указано BOTH, применяется FRONT.
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
 * Перечень настроек которые требуются для создания экземпляра макроса.
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
     *  только количество переключений и время проведенное в каждом положении.
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
  value: string;

  /**
   * Значение в единицах измерения, которое пользователь может задать, чтобы синхронизовать значение
   * прибора учета и макроса.
   */
  amount: number;
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
   * Скорость импульсов в час.
   */
  speed: number;

  /**
   * Количество секунд засчитанных как рабочее время устройства подключенного к реле.
   *
   * Моточасы учитываются только для CounterType => WORK_TIME.
   */
  workSec: number;
};

type CounterMacrosState = CounterMacrosPublicState & CounterMacrosPrivateState;

/**
 * ! OUTPUT
 */

/**
 * Результат работы макроса.
 */
type CounterMacrosNextOutput = {
  /**
   * Количество импульсов.
   */
  readonly impulse: number;

  /**
   * Скорость импульсов за все время, считается для всех типов кроме CounterType => WORK_TIME.
   */
  readonly speed: number;

  /**
   * Моточасы, > 0 будет только в случае CounterType => WORK_TIME.
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
  value: '',
  impulse: 0,
  speed: 0,
  workSec: 0,
  amount: 0,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class ImpulseCounterMacros extends Macros<MacrosType.COUNTER, CounterMacrosSettings, CounterMacrosState> {
  private output: CounterMacrosNextOutput;

  constructor(parameters: CounterMacrosParameters) {
    const settings = ImpulseCounterMacros.parseSettings(parameters.settings, parameters.version);
    const state = ImpulseCounterMacros.parseState(parameters.state);

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
      speed: -1,
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

  protected collecting() {
    const control = this.controls.get(getControlId(this.settings.devices));

    if (
      control &&
      (control.value === control.on || control.value === control.off || control.value === control.toggle) &&
      control.value !== this.state.value
    ) {
      this.state.value = control.value;
      this.state.impulse++;
      // TODO Add last impulse appear
    }
  }

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
      speed: -1,
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

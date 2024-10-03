import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:impulse-counter');

/**
 * TODO 2. Рассчитать output.
 *
 * TODO 3. Опубликовать Output как контролы устройства "Импульсный счетчик",
 * TODO     и они автоматом попадут в историю + контролами можно будет пользоваться.
 */

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
 * Перечень настроек которые требуются для создания экземпляра макроса.
 */
export type ImpulseCounterMacrosSettings = {
  /**
   * Единственное устройство, которое позволяет отслеживать переключения
   * ключа в приборе учета.
   */
  readonly devices: {
    readonly counter: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };
  };

  readonly properties: {
    /**
     * Тип счетчика, определяет поведение и единицу измерения.
     */
    readonly type: CounterType;

    /**
     * Настройка реакции на переключение ключа, в приборе учета.
     */
    readonly trigger: Trigger;

    /**
     * Единица измерения, определяет суффикс и формат числа.
     */
    readonly unitOfMeasurement: UnitOfMeasurement;

    /**
     * Стоимость одного импульса, в единичной единичной размерности (метры, литры, ваты, джоули),
     *  НЕ кило, мега, гига, ваты,
     *  НЕ кубические метры, дециметры, сантиметры.
     *
     * По умолчанию 0, ресурс не будет учитываться, будет учитываться
     *  только количество переключений и время проведенное в каждом положении.
     *
     * Например, 1 импульс может стоит 10 литров, или 10 ват, или 10 джоулей
     *  или любой другой единицы измерения.
     */
    readonly cost: number;

    /**
     * Минимальное время прохождения одного цикла учета в приборе учета.
     *
     * Для каждого прибора это время будет разное и определить его можно через натурное испытание, следующим
     *  способом, для прибора учета воды, нужно по немного открывать кран, чтобы увидеть когда он начнет реагировать,
     *  на поток воды и после чего замерить время прохождения одного круга учета до появления импульса.
     *
     * Таким образом мы откалибруем время после которого учитывать скорость нет смысла, и мы будем считать, что
     *  расход ресурса окончен.
     *
     * Для других приборов аналогично, газ, электричество, тепло.
     *
     * С теплом и электричеством немного сложнее,
     *  так как для постепенного расхода электричества, нужна будет управляемая нагрузка, а для
     *  расхода тепла, нужно зимнее время и сильно проветренная комната, чтобы по немного приоткрывать
     *  подачу теплоносителя в один прибор или приборы.
     */
    readonly timeToStopSec: number;
  };
};

/**
 * ! STATE
 */

/**
 * Публичное состояние счетчика, на которое пользователь может влиять.
 */
export type ImpulseCounterMacrosPublicState = {
  /**
   * Значение в единицах cost.
   *
   * Так как это фактически impulse * cost => amount, за все время учета.
   *
   * В дальнейшем можно скруглять к кило, мега, гига.
   */
  amount: number;
};

/**
 * Внутренне состояние счетчика, на которое пользователь НЕ может влиять.
 */
export type ImpulseCounterMacrosPrivateState = {
  /**
   * Последнее положение ключа, по нему определяется произошел или не произошел переход,
   *  в следующее состояние.
   */
  value: string;

  /**
   * Количество импульсов.
   */
  impulse: number;

  /**
   * Скорость расхода cost в секунду, считается для всех типов кроме CounterType => WORK_TIME.
   */
  speed: number;

  /**
   * Поле предоставляющее информацию, о том, есть ли расход ресурса.
   */
  hasConsumption: boolean;

  /**
   * Количество секунд засчитанных как рабочее время устройства подключенного к реле.
   *
   * Моточасы учитываются только для CounterType => WORK_TIME.
   */
  workSec: number;
};

type ImpulseCounterMacrosState = ImpulseCounterMacrosPublicState & ImpulseCounterMacrosPrivateState;

const defaultState: ImpulseCounterMacrosState = {
  value: '',
  impulse: 0,
  speed: 0,
  hasConsumption: false,
  workSec: 0,
  amount: 0,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

/**
 * ! OUTPUT
 */

/**
 * Результат работы макроса.
 */
type ImpulseCounterMacrosNextOutput = {
  /**
   * Количество импульсов.
   */
  readonly impulse: number;

  /**
   * Скорость расхода cost в секунду, считается для всех типов кроме CounterType => WORK_TIME.
   */
  readonly speed: number;

  /**
   * Моточасы, > 0 будет только в случае CounterType => WORK_TIME.
   */
  readonly workSec: number;

  /**
   * Значение в единицах cost.
   *
   * Так как это фактически impulse * cost => amount, за все время учета.
   *
   * В дальнейшем можно скруглять к кило, мега, гига.
   */
  readonly amount: number;

  /**
   * Единица измерения счетчика.
   */
  readonly unitOfMeasurement: UnitOfMeasurement;

  /**
   * Поле предоставляющее информацию, о том, есть ли расход ресурса.
   */
  readonly hasConsumption: boolean;
};

/**
 * Версия макроса, к версии привязана схеме настроек, состояния и их валидация при запуске,
 *  так же к схеме привязаны миграции схем при запуске.
 */
const VERSION = 0;

/**
 * ! CONSTRUCTOR PARAMS
 */
type ImpulseCounterMacrosParameters = MacrosParameters<string, string | undefined>;

export class ImpulseCounterMacros extends Macros<
  MacrosType.IMPULSE_COUNTER,
  ImpulseCounterMacrosSettings,
  ImpulseCounterMacrosState
> {
  private lastTwoImpulseTuple = [new Date(0), new Date(0)];

  private timer: {
    computeSpeed: NodeJS.Timeout;
  };

  private output: ImpulseCounterMacrosNextOutput;

  constructor(parameters: ImpulseCounterMacrosParameters) {
    const settings = ImpulseCounterMacros.parseSettings(parameters.settings, parameters.version);
    const state = ImpulseCounterMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      macrosRepository: parameters.macrosRepository,
      eventBus: parameters.eventBus,

      type: MacrosType.IMPULSE_COUNTER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, createDefaultState()),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.output = {
      impulse: -1,
      speed: -1,
      hasConsumption: false,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.IMPULSE,
    };

    this.timer = {
      computeSpeed: setInterval(this.computeSpeed, 1000),
    };
  }

  private getDebugContext = (mixin = {}) => {
    return {
      name: this.name,
      now: this.now,
      state: this.state,
      lastTwoImpulseTuple: this.lastTwoImpulseTuple,
      mixin,
      output: this.output,
    };
  };

  static parseSettings = (settings: string, version: number = VERSION): ImpulseCounterMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): ImpulseCounterMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): ImpulseCounterMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextStateJson: string): void => {
    const nextState = ImpulseCounterMacros.parsePublicState(nextStateJson, this.version);

    this.state.amount = nextState.amount;
    this.state.impulse = Math.round(nextState.amount / this.settings.properties.cost);
  };

  protected collecting() {
    const { type, trigger, cost } = this.settings.properties;

    const currentImpulseValue = this.state.value;

    const control = this.controls.get(getControlId(this.settings.devices.counter));

    if (
      control &&
      (control.value === control.on || control.value === control.off) &&
      control.value !== currentImpulseValue
    ) {
      const nextImpulseValue = control.value;

      if (trigger === Trigger.BOTH) {
        this.state.impulse++;
      }

      if (trigger === Trigger.FRONT && currentImpulseValue === control.off && nextImpulseValue === control.on) {
        this.state.impulse++;
      }

      if (trigger === Trigger.BACK && currentImpulseValue === control.on && nextImpulseValue === control.off) {
        this.state.impulse++;
      }

      if (type === CounterType.WORK_TIME) {
        /**
         * После запуска счетчика, this.impulse содержит tuple из двух дат со значением 0,
         *  нужно дождаться, когда появится первый импульс, и после этого, начать считать мото-часы.
         */
        const [, currentImpulse] = this.lastTwoImpulseTuple;

        const currentImpulseMs = currentImpulse.getTime();

        if (currentImpulseMs === 0) {
          this.lastTwoImpulseTuple.push(new Date());
          this.lastTwoImpulseTuple.splice(0, 1);

          return;
        }

        const workSec = Math.abs(currentImpulseMs - Date.now()) / 1000;

        if (
          (trigger === Trigger.FRONT || trigger === Trigger.BOTH) &&
          currentImpulseValue === control.on &&
          nextImpulseValue === control.off
        ) {
          this.state.workSec += workSec;
        }

        if (trigger === Trigger.BACK && currentImpulseValue === control.off && nextImpulseValue === control.on) {
          this.state.workSec += workSec;
        }
      } else {
        this.state.amount = this.state.impulse * cost;
      }

      this.state.value = nextImpulseValue;

      this.lastTwoImpulseTuple.push(new Date());
      this.lastTwoImpulseTuple.splice(0, 1);

      this.computeSpeed();

      this.saveState();

      logger.info('It was counted ✅');
      logger.debug(this.getDebugContext());
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
    const output: ImpulseCounterMacrosNextOutput = {
      impulse: -1,
      speed: -1,
      hasConsumption: false,
      workSec: -1,
      amount: -1,
      unitOfMeasurement: UnitOfMeasurement.IMPULSE,
    };

    this.output = output;

    logger.info('The next output was computed 🍋');
    logger.debug(this.getDebugContext());
  };

  protected send = () => {};

  protected destroy() {
    clearInterval(this.timer.computeSpeed);
  }

  /**
   * ! INTERNAL_IMPLEMENTATION
   */

  /**
   * Расчет скорости расхода ресурсов.
   */
  private computeSpeed = () => {
    const { type, cost, timeToStopSec } = this.settings.properties;

    if (type === CounterType.WORK_TIME) {
      this.state.speed = 0;
      this.state.hasConsumption = false;

      return;
    }

    const [previousImpulse, currentImpulse] = this.lastTwoImpulseTuple;

    const previousImpulseMs = previousImpulse.getTime();
    const currentImpulseMs = currentImpulse.getTime();

    if (previousImpulseMs === 0 || currentImpulseMs === 0) {
      /**
       * В случае, если не появились первые два импульса, после старта счетчика, расчет скорости невозможен.
       *
       * Необходимо дождаться появления первых двух импульсов.
       */

      this.state.speed = 0;
      this.state.hasConsumption = false;

      return;
    }

    const timeBetweenLastImpulseAndNowSec = Math.abs(currentImpulseMs - Date.now()) / 1000;

    logger.info('Compute speed 🏃🏼‍♀️');
    logger.debug({
      type,
      cost,
      timeToStopSec,
      previousImpulse,
      previousImpulseMs,
      currentImpulse,
      currentImpulseMs,
      now: Date.now(),
      timeBetweenLastImpulseAndNowSec,
      'timeBetweenLastImpulseAndNowSec > timeToStopSec': timeBetweenLastImpulseAndNowSec > timeToStopSec,
    });

    if (
      timeBetweenLastImpulseAndNowSec > timeToStopSec &&
      (this.state.speed !== 0 || this.state.hasConsumption !== false)
    ) {
      /**
       * Если время между последним импульсом и текущим моментом больше timeToStopSec
       *  расчет скорости останавливается, и считается, что расход закончился.
       */

      this.state.speed = 0;
      this.state.hasConsumption = false;

      logger.info('STOP CONSUMPTION 🛑 🛑 🛑 🛑 🛑');

      this.saveState();
    } else {
      /**
       * В этом случае, считаем, что расход имеется, и можно определять скорость.
       */

      const timeBetweenImpulsesSec = Math.abs(previousImpulseMs - currentImpulseMs) / 1000;

      logger.debug({
        previousImpulseMs,
        currentImpulseMs,
        timeBetweenImpulsesSec,
        timeToStopSec,
      });

      if (timeBetweenImpulsesSec > timeToStopSec) {
        /**
         * Случай, когда случился только первый импульс, после остановки расхода.
         *
         * Как только появится второй импульс, можно будет узнать скорость между этими импульсами.
         */

        this.state.speed = 0;
        this.state.hasConsumption = false;

        return;
      }

      /**
       * Мы знаем значение минимального расхода это timeToStopSec
       *
       * Мы знаем расстояние между импульсами.
       *
       * Мы знаем цену одного импульса.
       *
       * При timeToStopSec скорость будет равна cost / timeToStopSec => 10 литров / 30 сек =>
       *  0.33 литра/сек => 0.33 * 60 * 60 => 1188 л/час.
       *
       * Моментальный расход равен cost / timeBetweenImpulsesSec => 10 литров на 7 сек =>
       *  1.42 литра/сек => 1.42 * 60 * 60 => 5142 л/час.
       *
       * При появлении нового импульса, у нас появляется возможность, рассчитать скорость,
       *  таким образом мы будем узнавать о скорости, только при появлении импульсов.
       *
       * Между импульсами, мы считаем, что скорость одинаковая.
       */
      this.state.speed = cost / timeBetweenImpulsesSec;
      this.state.hasConsumption = true;

      logger.info('DURING CONSUMPTION ✅ ✅ ✅ ✅ ✅ ✅');
    }
  };
}

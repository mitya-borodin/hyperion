/* eslint-disable unicorn/consistent-destructuring */
/* eslint-disable unicorn/no-array-reduce */
import { addDays, addMinutes, compareAsc, format, subDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { config } from '../../../infrastructure/config';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { HyperionDeviceControl } from '../../hyperion-control';
import { HyperionDevice } from '../../hyperion-device';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

import { settings_from_0_to_1 } from './settings-mappers/0-settings-from-0-to-1';
import { settings_from_1_to_2 } from './settings-mappers/1-settings-from-1-to-2';
import { settings_from_2_to_3 } from './settings-mappers/2-settings-from-2-to-3';
import { settings_from_3_to_4 } from './settings-mappers/3-settings-from-3-to-4';
import { settings_from_4_to_5 } from './settings-mappers/4-settings-from-4-to-5';
import { settings_from_5_to_6 } from './settings-mappers/5-settings-from-5-to-6';
import { settings_from_6_to_7 } from './settings-mappers/5-settings-from-6-to-7';

const logger = getLogger('hyperion:macros:lighting');

/**
 * ! Lighting macros scenarios
 *
 * Освещение управляется при помощи: кнопок, герконов, освещенности, движения, шума, времени.
 *
 * 1. Вкл/Выкл через кнопки
 *  Классический способ переключения освещения при котором нужно нажимать на кнопку
 * 2. Вкл/Выкл через герконы
 *  Позволяет включать освещение в момент начала открывания двери.
 *  Для выключения света применяются правила основанные на освещенности, движении, шуме и времени.
 *  Отсутствует приоритет как у кнопок
 * 3. Ограничение включения через датчик освещенности
 *  Позволяет НЕ включать освещение пока не будет достигнут определенный уровень освещенности.
 * 4. Вкл/Выкл через датчик движения и шума
 *  Позволяет включать освещение при наличии движения и выключать при пропадании движения и шума.
 *  Возможно задать задать задержку выключения при наличии движения и шума.
 *  Если нет ни движения ни шума, то свет выключится через заданное время, например 1 минуту.
 *  Если нет движения но есть шум, то свет выключится через заданное время, например 15 минут.
 * 5. Выключать освещение в определенный час суток
 *  Возможно задать час в который одноразово выключится освещение, как будто была нажата кнопка.
 * 6. Блокировка включения освещения по временному диапазону
 *  Возможно задать диапазон часов в сутках когда автоматическое включение освещение активно например от 15 и до 0
 * 7. Блокировка по нажатию кнопки
 *  Возможно задать время блокировки автоматического выключения или/и включения при выключении или включении через
 *    кнопку.
 *
 * Для добавления дополнительного сценария обращаться к dmitriy@borodin.site
 */

/**
 * ! SETTINGS
 */

/**
 * Состояние переключателя (реле, кнопка)
 */
export enum Switch {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Определяет по верхнему ("1", +5, true) или по нижнему ("0", 0, false) уровню случится реакция.
 */
export enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Правило определения числового значения по нескольким датчикам
 * MAX - берем максимальное среди всех
 * MIN - берем минимальное среди всех
 * AVG - берем среднее среди всех
 */
export enum LevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

/**
 * Принудительное состояние освещения, может задаваться из приложения.
 */
export enum LightingForce {
  ON = 'ON',
  OFF = 'OFF',
  UNSPECIFIED = 'UNSPECIFIED',
}

/**
 * Перечень настроек которые требуются для создания экземпляра макроса.
 */
export type LightingMacrosSettings = {
  /**
   * Список устройств которые участвую в макросе
   */
  readonly devices: {
    readonly switchers: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;
    readonly illuminations: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ILLUMINATION;
    }>;
    readonly motions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;
    readonly noises: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SOUND_LEVEL;
    }>;
    readonly lightings: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;
  };

  readonly properties: {
    /**
     * Настройки переключателей
     */
    readonly switcher: {
      /**
       * Переключает реакцию на положение переключателя
       *
       * UP - переключатель нажали/замкнули
       * DOWN - переключатель отпустили/разомкнули
       */
      readonly trigger: Trigger;

      /**
       * Позволяет до-включить/выключить все группы.
       *
       * Если true, и в списке групп есть включенные и выключенные группы,
       * произойдет включенных выключение групп.
       *
       * Если false, и в списке групп есть включенные и выключенные группы,
       * произойдет выключение включенных групп.
       *
       * Если в списке все группы в одном состоянии, то произойдет инверсия состояния.
       */
      readonly everyOn: boolean;
    };

    /**
     * Настройки автоматизации по освещению.
     */
    readonly illumination: {
      readonly detection: LevelDetection;

      /**
       * Пороговые значения освещенности для включения и выключения освещения.
       *
       * Если ON меньше 5 то нужно включить, если OFF больше 300, то нужно выключить.
       *
       * Если OFF > ON, то OFF и ON будут перевернуты.
       *
       * При включенном освещении, пороговое значение OFF умножается на mul,
       * чтобы предотвратить автоматическое ВЫКлючение по освещенности.
       */
      readonly boundary: {
        onLux: number;
        offLux: number;
      };
    };

    /**
     * Настройки автоматизации по движению
     */
    readonly motion: {
      readonly detection: LevelDetection;

      /**
       * Задает чувствительность к движению.
       *
       * Если значение освещение выше уставки, то движение обнаружено.
       * Если значение ниже уставки то движение не обнаружено.
       */
      readonly trigger: number;

      /**
       * Расписание активации ВКЛючения по освещению.
       *
       * Если указать указать одинаковые значение (0, 0 или 15,15)
       * это будет восприниматься как диапазон [from, to + 24].
       *
       * Диапазон значений 0...23
       */
      readonly schedule: {
        readonly fromHour: number;
        readonly toHour: number;
      };
    };

    /**
     * Настройки автоматизации по шуму
     */
    readonly noise: {
      readonly detection: LevelDetection;

      /**
       * Задает чувствительность к шуму.
       *
       * Если значение освещение выше уставки, то шум обнаружен.
       * Если значение ниже уставки то шум не обнаружен.
       */
      readonly trigger: number;
    };

    /**
     * Задержка отключения, для случая когда нет движения но есть шум.
     *
     * Считается, что движение отсутствует спустя silenceMin с последнего обнаружения.
     *
     * Значение задается в минутах.
     *
     * Если > 0, то в случае отсутствия движения и при наличии шума,
     * через указанное время произойдет отключение.
     *
     * Если указать <= 0, то проверка перестанет работать.
     */
    readonly noiseWithoutMotionMin: number;

    /**
     * Задержка отключения, для случая когда нет движения и нет шума.
     *
     * Значение задается в минутах.
     *
     * Если > 0, то в случае отсутствия шума и движения, через указанное время
     * будет определена полная тишина.
     *
     * Если указать <= 0, то проверка перестанет работать.
     */
    readonly silenceMin: number;

    /**
     * Настройка времени блокировки автоматического переключения.
     *
     * BLOCK_ON должен быть меньше BLOCK_OFF, если пользователь задал на оборот,
     * то значения поменяются местами.
     *
     * Блокировка включается при переключении пользователем,
     * через кнопку (физическую, виртуальную).
     *
     * Блокируется при единоразовом выключении освещения.
     *
     * Если пользователь включил освещение, то заблокируется выключение.
     * Если пользователь выключил освещение, то заблокируется включение.
     */
    readonly block: {
      readonly onMin: number;
      readonly offMin: number;
    };

    /**
     * Единоразовое отключение освещения.
     *
     * При выключении блокируется включение, на время указанное в настройках blocks.
     *
     * Значение указывается в часах 0...23.
     */
    readonly offByTime: number;

    /**
     * Позволяет отключить функцию автоматического включения.
     */
    readonly autoOn: boolean;
  };
};

/**
 * ! STATE
 */

/**
 * ! PUBLIC STATE
 */

/**
 * Состояние макроса которое может изменить пользователь
 */
export type LightingMacrosPublicState = {
  force: LightingForce;
};

/**
 * ! PRIVATE STATE
 */

/**
 * Внутреннее состояние макроса, которое не может изменить пользователь.
 * Оно нужно для реализации внутреннего устройства макроса.
 */
type LightingMacrosPrivateState = {
  switch: Switch;
  illumination: number;
  motion: number;
  noise: number;
  /**
   * Время в часах на текущие сутки 0...23
   */
  time: number;
};

/**
 * ! FULL STATE
 */

type LightingMacrosState = LightingMacrosPublicState & LightingMacrosPrivateState;

/**
 * ! OUTPUT
 */

/**
 * Будущее состояние контролов, передается в контроллер по средством MQTT
 */
type LightingMacrosOutput = {
  lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

/**
 * ! CONSTRUCTOR PARAMS
 */
type LightingMacrosParameters = MacrosParameters<string, string | undefined>;

/**
 * ! VERSION - текущая версия макроса освещения
 */
const VERSION = 7;

const defaultState: LightingMacrosState = {
  force: LightingForce.UNSPECIFIED,
  switch: Switch.OFF,
  illumination: -1,
  motion: -1,
  noise: -1,
  time: 1,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private output: LightingMacrosOutput;

  /**
   * Временные точки до которых действует блокировка.
   */
  private block: {
    on: Date;
    off: Date;
  };

  /**
   * Текущие сутки, позволяет не выполнять действия несколько раз в одних сутках.
   */
  private day: [Date, Date];

  private last = {
    motion: new Date(),
    noise: new Date(),
  };

  private clock: NodeJS.Timeout;

  constructor(parameters: LightingMacrosParameters) {
    const settings = LightingMacros.parseSettings(parameters.settings, parameters.version);
    const state = LightingMacros.parseState(parameters.state, parameters.version);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.LIGHTING,

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
      lightings: [],
    };

    this.block = {
      on: subDays(new Date(), 1),
      off: subDays(new Date(), 1),
    };

    this.day = [new Date(), new Date()];

    this.setupAutoOffTime();

    this.clock = setInterval(this.tic, 60 * 1000);
  }

  private getDebugContext = (mixin = {}) => {
    return {
      name: this.name,
      now: this.now,

      day: this.day,

      time: this.time,
      isDay: this.isDay,
      isNight: this.isNight,

      block: this.block,
      last: this.last,

      isAutoOnEnabled: this.isAutoOnEnabled,

      isAutoOnBlocked: this.isAutoOnBlocked,
      isAutoOffBlocked: this.isAutoOffBlocked,

      isLightingOn: this.isLightingOn,
      isLightingOff: this.isLightingOff,

      hasIlluminationDevice: this.hasIlluminationDevice,
      hasMotionDevice: this.hasMotionDevice,
      hasNoiseDevice: this.hasNoiseDevice,

      isIlluminationDetected: this.isIlluminationDetected,
      isMotionDetected: this.isMotionDetected,
      isSilence: this.isSilence,
      isNoiseWithoutMotion: this.isNoiseWithoutMotion,

      automaticSwitchingOnByIllumination: this.automaticSwitchingOnByIllumination,
      automaticSwitchingOnByMotion: this.automaticSwitchingOnByMotion,

      automaticSwitchingOffByIllumination: this.automaticSwitchingOffByIllumination,
      automaticSwitchingOffByMovementAndNoise: this.automaticSwitchingOffByMovementAndNoise,

      state: this.state,
      output: this.output,

      mixin,
    };
  };

  static parseSettings = (settings: string, version: number = VERSION): LightingMacrosSettings => {
    return Macros.migrate(
      settings,
      version,
      VERSION,
      [
        settings_from_0_to_1,
        settings_from_1_to_2,
        settings_from_2_to_3,
        settings_from_3_to_4,
        settings_from_4_to_5,
        settings_from_5_to_6,
        settings_from_6_to_7,
      ],
      'settings',
    );
  };

  static parseState = (state?: string, version: number = VERSION): LightingMacrosState => {
    if (!state) {
      return defaultsDeep(state, createDefaultState());
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): LightingMacrosPublicState => {
    if (!state) {
      return defaultsDeep(state, createDefaultState());
    }

    /**
     * TODO Передать схему, только для публичного стейта
     */
    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicState: string): void => {
    const nextState: LightingMacrosPublicState = LightingMacros.parsePublicState(nextPublicState, this.version);

    logger.info('The next public state was supplied 📥');
    logger.debug(this.getDebugContext({ nextState }));

    switch (nextState.force) {
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
        logger.info('An incorrect state was received 🚨');
        logger.debug(this.getDebugContext({ nextState }));

        return;
      }
    }

    logger.info('The next state 📥 was applied ✅');
    logger.debug(this.getDebugContext({ nextState }));

    this.execute();
  };

  protected collecting() {
    this.collectSwitchers();
    this.collectIllumination();
    this.collectMotion();
    this.collectNoise();
  }

  private get isSilence(): boolean {
    const { silenceMin } = this.settings.properties;

    return (
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      compareAsc(new Date(), addMinutes(new Date(this.last.motion.getTime()), silenceMin)) === 1 &&
      compareAsc(new Date(), addMinutes(new Date(this.last.noise.getTime()), silenceMin)) === 1
    );
  }

  private get isNoiseWithoutMotion(): boolean {
    const { noiseWithoutMotionMin, silenceMin } = this.settings.properties;

    return (
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      Number.isInteger(noiseWithoutMotionMin) &&
      noiseWithoutMotionMin > 0 &&
      /**
       * Спустя silenceMin + noiseWithoutMotionMin после последнего обнаружения
       * движения, считаем, что пора выключать свет.
       */
      compareAsc(new Date(), addMinutes(new Date(this.last.motion.getTime()), silenceMin + noiseWithoutMotionMin)) === 1
    );
  }

  private get isAutoOnEnabled(): boolean {
    return this.settings.properties.autoOn;
  }

  private get isAutoOnBlocked(): boolean {
    return compareAsc(this.block.on, new Date()) === 1;
  }

  private get isAutoOffBlocked(): boolean {
    return compareAsc(this.block.off, new Date()) === 1;
  }

  private get isLightingOn(): boolean {
    return this.state.switch === Switch.ON;
  }

  private get isLightingOff(): boolean {
    return this.state.switch === Switch.OFF;
  }

  private get hasIlluminationDevice(): boolean {
    return this.settings.devices.illuminations.length > 0;
  }

  private get hasMotionDevice(): boolean {
    return this.settings.devices.motions.length > 0;
  }

  private get hasNoiseDevice(): boolean {
    return this.settings.devices.noises.length > 0;
  }

  private get isIlluminationDetected(): boolean {
    return this.state.illumination >= 0;
  }

  private get isMotionDetected(): boolean {
    const { trigger } = this.settings.properties.motion;

    return Number.isInteger(trigger) && trigger > 0 && this.state.motion >= trigger;
  }

  /**
   * ! AutoOn по датчикам освещенности.
   *
   * * При наличии датчиков движения, освещенность становится фактором
   * * блокировки включения, то есть пока не потемнеет, группа не
   * * будет включена даже если есть движение.
   */
  private get automaticSwitchingOnByIllumination(): boolean {
    return (
      this.hasIlluminationDevice &&
      this.isIlluminationDetected &&
      this.state.illumination <= this.settings.properties.illumination.boundary.onLux
    );
  }

  /**
   * ! AutoOn по датчикам движения.
   *
   * Если имеются датчики освещенности, то учитывается
   * значение освещенности перед проверкой движения.
   */
  private get automaticSwitchingOnByMotion(): boolean {
    return this.hasIlluminationDevice
      ? this.hasMotionDevice && this.automaticSwitchingOnByIllumination && this.isMotionDetected
      : this.hasMotionDevice && this.isMotionDetected;
  }

  /**
   * ! AutoOff по датчикам освещенности.
   *
   * Как только освещенность превышает заданный порог, группа будет выключена.
   *
   * Работает когда имеются датчики освещенности.
   */
  private get automaticSwitchingOffByIllumination(): boolean {
    return (
      this.hasIlluminationDevice &&
      this.isIlluminationDetected &&
      /**
       * Если включено освещение, то автоматическое отключение по освещения выключается,
       * остается только по полной тишине.
       *
       * ? А на кой тогда вообще учитывать освещенность для выключения,
       * ? скорее всего сработает в случае, когда светильник и датчик в разных местах.
       */
      /**
       * !this.isLightingOn &&
       */
      /**
       * Нужно выставлять illumination.boundary.offLux выше освещенности которую дают светильники.
       */
      this.state.illumination >= this.settings.properties.illumination.boundary.offLux
    );
  }

  /**
   * ! AutoOff по датчикам движения и звука.
   *
   * Как только пропадает движение и шум группа будет выключена.
   *
   * Работает когда имеются датчики движения.
   */
  private get automaticSwitchingOffByMovementAndNoise(): boolean {
    return this.hasMotionDevice && this.hasNoiseDevice && (this.isSilence || this.isNoiseWithoutMotion);
  }

  private collectSwitchers = () => {
    /**
     * Актуализация состояния освещения по внешнему состоянию каждой группы освещения.
     */
    const isSomeOn = this.settings.devices.lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      if (control) {
        return control.value === control.on;
      }

      return false;
    });

    const nextState: Switch = isSomeOn ? Switch.ON : Switch.OFF;

    if (this.state.switch === nextState) {
      return;
    }

    logger.info('The lighting condition has been updated externally 🚥');
    logger.debug(
      this.getDebugContext({
        isSomeOn,
        nextState,
        lightings: this.settings.devices.lightings.map((lighting) => {
          return {
            value: this.controls.get(getControlId(lighting))?.value,
          };
        }),
      }),
    );

    this.state.switch = nextState;
  };

  private collectIllumination = () => {
    const { detection } = this.settings.properties.illumination;
    const { illuminations } = this.settings.devices;

    this.state.illumination = this.getValueByDetection(illuminations, detection);
  };

  private collectMotion = () => {
    const { trigger } = this.settings.properties.motion;

    if (trigger > 0) {
      this.state.motion = this.getValueByDetection(
        this.settings.devices.motions,
        this.settings.properties.motion.detection,
      );

      if (this.state.motion >= trigger) {
        this.last.motion = new Date();
      }
    }
  };

  private collectNoise = () => {
    const { trigger } = this.settings.properties.noise;

    if (trigger > 0) {
      this.state.noise = this.getValueByDetection(
        this.settings.devices.noises,
        this.settings.properties.noise.detection,
      );

      if (this.state.noise >= trigger) {
        this.last.noise = new Date();
      }
    }
  };

  protected priorityComputation = (): boolean => {
    if (this.state.force !== 'UNSPECIFIED') {
      const control = this.getFirstLightingControl();

      if (!control) {
        logger.error('Not a single lamp will be found 🚨');
        logger.error(this.getDebugContext());

        return false;
      }

      let nextSwitchState: Switch = Switch.OFF;

      if (this.state.force === 'ON') {
        nextSwitchState = Switch.ON;
      }

      if (this.state.force === 'OFF') {
        nextSwitchState = Switch.OFF;
      }

      this.computeOutput();

      if (this.output.lightings.length > 0) {
        logger.info('The force state was determined 🫡 😡 😤 🚀');
        logger.debug(this.getDebugContext({ nextSwitchState }));

        this.state.switch = nextSwitchState;

        this.send();
      }

      return true;
    }

    return false;
  };

  protected actionBasedComputing = (current?: HyperionDevice): boolean => {
    let isSwitchHasBeenChange = false;

    if (this.settings.properties.switcher.trigger === Trigger.UP) {
      isSwitchHasBeenChange = this.isSwitchHasBeenUp();

      if (isSwitchHasBeenChange) {
        logger.info('The switch would be closed 🔒');
      }
    }

    if (this.settings.properties.switcher.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      if (isSwitchHasBeenChange) {
        logger.info('The switch was open 🔓');
      }
    }

    if (isSwitchHasBeenChange) {
      const control = this.getFirstLightingControl();

      if (!control) {
        logger.error('Not a single lamp will be found 🚨');
        logger.error(this.getDebugContext());

        return false;
      }

      logger.debug(this.getDebugContext({ deviceId: current?.id, controlId: current?.controls.map(({ id }) => id) }));

      let nextSwitchState: Switch = Switch.OFF;

      if (this.state.switch === Switch.ON) {
        if (this.settings.properties.switcher.everyOn) {
          /**
           * ! Если хотя бы один контрол из группы включен, то при первом клике, нужно включить все остальные, а
           * ! при втором клике все выключаем.
           */
          const everyOn = this.settings.devices.lightings.every((lighting) => {
            const control = this.controls.get(getControlId(lighting));

            return control?.value === control?.on;
          });

          nextSwitchState = everyOn ? Switch.OFF : Switch.ON;
        } else {
          nextSwitchState = Switch.OFF;
        }
      } else if (this.state.switch === Switch.OFF) {
        nextSwitchState = Switch.ON;
      } else {
        logger.error('No handler found for the current state 🚨');
        logger.error(this.getDebugContext());

        nextSwitchState = Switch.OFF;
      }

      if (this.state.switch !== nextSwitchState) {
        /**
         * В случае если включена функциональность autoOn по датчику освещенности,
         * мы не сможем выключить освещение, для того, чтобы дать возможность выключить
         * освещение в ручном режиме, нужно добавить блокировку autoOn на какое-то время.
         *
         * Блокировку можно выключить установив значение 0
         */
        if (nextSwitchState === Switch.OFF) {
          logger.info('The lighting is ON 💡');

          this.block.on = addMinutes(new Date(), this.settings.properties.block.onMin);

          logger.info('The auto ON block was activated ⏱️ 🛑');
          logger.debug(this.getDebugContext({ autoOnBlockedFor: format(this.block.on, 'yyyy.MM.dd HH:mm:ss OOOO') }));
        }

        if (nextSwitchState === Switch.ON) {
          logger.info('The lighting is OFF 🕯️');

          this.block.off = addMinutes(new Date(), this.settings.properties.block.offMin);

          logger.info('The auto OFF block was activated ⏱️ 🛑');
          logger.debug(this.getDebugContext({ autoOffBlockedFor: format(this.block.off, 'yyyy.MM.dd HH:mm:ss OOOO') }));
        }

        this.state.switch = nextSwitchState;

        this.computeOutput();
        this.send();

        return true;
      }
    }

    return false;
  };

  protected sensorBasedComputing(): boolean {
    const previousState = this.state.switch;

    this.autoOn();
    this.autoOff();

    if (previousState !== this.state.switch) {
      this.computeOutput();
      this.send();

      return true;
    }

    return false;
  }

  /**
   * Обработка состояния переключателя, в роли переключателя может быть: кнопка, герметичный контакт, реле.
   */
  private autoOn = (): boolean => {
    if (!this.isAutoOnEnabled || this.isAutoOnBlocked || this.isLightingOn) {
      return false;
    }

    let nextSwitchState: Switch = this.state.switch;

    /**
     *  Если датчики движения отсутствуют, можно включить группу без проверки движения.
     *
     *  Если датчики движения, присутствуют, проверка продолжается и autoOnByIllumination
     *   выполняет роль блокировки по освещенности.
     */
    if (this.automaticSwitchingOnByIllumination && !this.hasMotionDevice) {
      nextSwitchState = Switch.ON;
    }

    const { fromHour, toHour } = this.settings.properties.motion.schedule;

    const isPartTimeActive = fromHour >= 0 && fromHour <= 23 && toHour >= 0 && toHour <= 23;

    if (this.automaticSwitchingOnByMotion) {
      if (isPartTimeActive) {
        if (this.hasHourOverlap(fromHour, toHour, 'hour')) {
          nextSwitchState = Switch.ON;
        }
      } else {
        nextSwitchState = Switch.ON;
      }
    }

    if (nextSwitchState !== this.state.switch) {
      logger.info('The automatic lighting switching ON 💡');
      logger.debug(
        this.getDebugContext({
          nextSwitchState,
          isPartTimeActive,
          fromHour,
          toHour,
          hasHourOverlap: this.hasHourOverlap(fromHour, toHour, 'hour'),
        }),
      );

      this.state.switch = nextSwitchState;

      return true;
    }

    return false;
  };

  private autoOff = (): boolean => {
    if (this.isAutoOffBlocked || this.isLightingOff) {
      return false;
    }

    let nextSwitchState: Switch = this.state.switch;

    if (this.automaticSwitchingOffByIllumination) {
      nextSwitchState = Switch.OFF;
    }

    if (this.automaticSwitchingOffByMovementAndNoise) {
      nextSwitchState = Switch.OFF;
    }

    if (nextSwitchState !== this.state.switch) {
      logger.info('The automatic lighting switching OFF 🕯️');
      logger.debug(stringify(this.getDebugContext({ nextSwitchState })));

      this.state.switch = nextSwitchState;

      return true;
    }

    return false;
  };

  protected computeOutput() {
    const output: LightingMacrosOutput = {
      lightings: [],
    };

    for (const lighting of this.settings.devices.lightings) {
      const type = ControlType.SWITCH;

      const control = this.controls.get(getControlId(lighting));

      if (!control || control.type !== type || !control.topic.write) {
        logger.error('The control specified in the settings was not found, or matches the parameters 🚨');
        logger.error(this.getDebugContext({ device: lighting, type, controls: [...this.controls.values()] }));

        continue;
      }

      let value = control.off;

      if (this.state.switch === Switch.ON) {
        value = control.on;
      }

      if (this.state.switch === Switch.OFF) {
        value = control.off;
      }

      if (String(control.value) !== String(value)) {
        output.lightings.push({
          deviceId: lighting.deviceId,
          controlId: lighting.controlId,
          value: String(value),
        });
      }
    }

    this.output = output;
  }

  protected send() {
    for (const lighting of this.output.lightings) {
      const hyperionDevice = this.devices.get(lighting.deviceId);
      const hyperionControl = this.controls.get(getControlId(lighting));
      const topic = hyperionControl?.topic.write;
      const message = lighting.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(
          this.getDebugContext({ hyperionDevice, controlId: getControlId(lighting), hyperionControl, lighting }),
        );

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug(this.getDebugContext({ topic, message }));

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    this.output.lightings = [];
  }

  protected destroy() {
    clearInterval(this.clock);
  }

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.devices.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.devices.switchers);
  }

  private getFirstLightingControl = () => {
    let control: HyperionDeviceControl | undefined;

    for (const item of this.settings.devices.lightings) {
      control = this.controls.get(getControlId(item));

      if (control) {
        return control;
      }
    }
  };

  /**
   * Настройка this.block.autoOff.day
   */
  private setupAutoOffTime = () => {
    /**
     * offByTime - количество часов указано в временной зоне клиента
     */
    const { offByTime } = this.settings.properties;

    /**
     * Если offByTime не в диапазоне 0 - 23, не выполняем отключение по времени
     */
    if (offByTime < 0 || offByTime > 23) {
      return;
    }

    const now = utcToZonedTime(new Date(), config.client.timeZone);

    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    /**
     * Устанавливаем время клиентской временной зоны, оставаясь в UTC
     */
    const hours = utcToZonedTime(new Date(), config.client.timeZone).getHours();

    /**
     * Задаются текущие сутки, от 00:00 до 23:59:59 во временной зоне UTC
     */
    const from = utcToZonedTime(new Date(), config.client.timeZone);

    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);
    from.setMilliseconds(0);

    const to = utcToZonedTime(new Date(), config.client.timeZone);

    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);
    to.setMilliseconds(0);

    this.day = [from, to];

    logger.info('Setup setup auto off time ⏱️');
    logger.debug(this.getDebugContext({ year, month, date, offByTime, hours }));

    /**
     * Если в момент старта сервиса 15 часов, а time установлен как 13, то нужно передвинуть диапазон на сутки вперед,
     * и событие по отключению произойдет на следующие сутки в 13 часов.
     *
     * Если в момент старта сервиса 15 часов, а time установлен на 23 часа, то останутся текущие сутки.
     *
     * Если в момент старта сервиса 15 часов, а time установлен на 0, то нужно передвинуть диапазон на сутки вперед,
     * и событие по отключению произойдет на следующие сутки в 0 часов.
     */
    if (hours > offByTime) {
      const [from, to] = this.day;

      this.day = [addDays(from, 1), addDays(to, 1)];
    }
  };

  /**
   * Обработчик счетчика часов, в рамках этого обработчика, будут случаться
   * все действия связанные с течением времени.
   */
  private tic = () => {
    /**
     * offByTime - количество часов указано в временной зоне клиента
     */
    const { offByTime } = this.settings.properties;

    /**
     * Если time не в диапазоне 0 - 23, не выполняем отключение по времени
     */
    if (offByTime < 0 || offByTime > 23) {
      return;
    }

    /**
     * Устанавливаем время клиентской временной зоны, оставаясь в UTC
     */
    const now = utcToZonedTime(new Date(), config.client.timeZone);
    const hours = utcToZonedTime(new Date(), config.client.timeZone).getHours();

    /**
     * from, to - находятся во временной зоне UTC, и время там жестко задано
     *  от 00:00 до 23:59:59
     */
    const [from, to] = this.day;

    const timeHasCome = hours === offByTime;
    const hasOverlapMomentAndDay = now.getTime() >= from.getTime() && now.getTime() <= to.getTime();

    if (timeHasCome && hasOverlapMomentAndDay) {
      this.day = [addDays(from, 1), addDays(to, 1)];

      if (this.isLightingOn) {
        this.state.switch = Switch.OFF;

        logger.info('The lighting OFF by IME POINT 🕯️');

        this.block.on = addMinutes(new Date(), this.settings.properties.block.onMin);

        logger.info('The auto ON block was activated ⏱️ 🛑');
        logger.debug(this.getDebugContext({ autoOnBlockedFor: format(this.block.on, 'yyyy.MM.dd HH:mm:ss OOOO') }));

        this.computeOutput();
        this.send();
      }
    }
  };
}

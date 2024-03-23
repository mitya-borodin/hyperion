/* eslint-disable unicorn/no-array-reduce */
import { addDays, addHours, addMinutes, compareAsc, format, subDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import debug from 'debug';

import { stringify } from '../../../helpers/json-stringify';
import { config } from '../../../infrastructure/config';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../../control-type';
import { HyperionDeviceControl } from '../../hyperion-control';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

import { settings_from_1_to_2 } from './settings-mappers/settings-from-1-to-2';
import { settings_to_1 } from './settings-mappers/settings-to-1';

const logger = debug('hyperion-lighting-macros');

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
 * Уровни освещенности который определил макрос по всем имеющимся датчикам в соответствии с
 * правилом определения
 */
export enum LightingLevel {
  MAX = 3,
  HIGHT = 2,
  MIDDLE = 1,
  LOW = 0,
  UNSPECIFIED = -1,
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
 * ! Lighting macros scenarios
 *
 * Освещение управляется при помощи: кнопок, герконов, освещенности, движения, шума, времени.
 *
 * 1. Вкл/Выкл через кнопки
 *  Классический способ переключения освещения при котором нужно нажимать на кнопку
 * 2. Вкл/Выкл через герконы
 *  Позволяет включать освещение в момент начала открывания двери.
 *  Для выключения света применяются правила основанные на освещенности, движении, шуме и времени.
 * 3. Вкл/Выкл через датчик освещенности
 *  Позволяет включать освещение при достижении определенного уровня освещенности, а так же
 *   выключать, в случае изменения освещенности в большую сторону.
 * 4. Вкл/Выкл через датчик движения
 *  Позволяет включать освещение при наличии движения и выключать при пропадании движения.
 * 5. Выключать освещение в определенный час суток
 *  Возможно задать, что освещение выключается в 0 часов, и при наступлении нуля часов
 *   освещение единоразово выключится
 * 6. Выключение освещения по датчику движения и шума
 *  Возможно задать задать задержку выключения при наличии движения и/или шума.
 *  Допустим если нет движения и есть шум то свет выключится через 10 минут, а если
 *   нет ни движения ни шума то через 1 минуту.
 * 7. Блокировка включения освещения по датчику освещенности
 *  Возможно задать значение освещенности выше которого освещение не будет включаться.
 * 8. Блокировка включения освещения по временному диапазону
 *  Возможно задать диапазон часов в сутках когда автоматическое включение освещение активно например от 15 и до 0
 * 9. Блокировка по нажатию кнопки
 *  Возможно задать время блокировки автоматического выключения или/и включения при выключении или включении через
 *    кнопку.
 *
 * В настройках макроса можно задать все необходимые параметры
 *  для реакции на освещенность, движение, переключатели, время.
 *
 * Все перечисленные возможности скомбинированы и работают сообща.
 */
export type LightingMacrosSettings = {
  /**
   * Список устройств которые участвую в макросе
   */
  readonly devices: {
    readonly switchers: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly illuminations: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly motion: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly noise: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly lightings: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
  };
  /**
   * Настройки макроса
   */
  readonly properties: {
    readonly switcher: {
      /**
       * Переключает реакцию на положение переключателя
       *
       * UP - переключатель нажали/замкнули
       * DOWN - переключатель отпустили/разомкнули
       */
      readonly trigger: Trigger;
      /**
       * Позволяет отключить функционал до-включения выключенных lightings.
       *
       * Если true, то при нажатии на кнопку сначала включатся все не включенные групы, а после
       *  чего произойдет выключение, если все включены, то выключение произойдет сразу.
       *
       * Если false, то сразу произойдет выключение включенных групп.
       */
      readonly everyOn: boolean;
    };

    readonly illumination: {
      /**
       * Настройка освещенности для каждого уровня. Чтобы понять какие значения выставлять, нужно посмотреть
       * какие значения дают датчики в нужных местах в разное время суток.
       *
       * Значения могут быть в диапазоне 0...10000
       */
      readonly HIGHT: number;
      readonly MIDDLE: number;
      readonly LOW: number;

      readonly detection: LevelDetection;
    };

    readonly motion: {
      readonly detection: LevelDetection;
    };

    readonly noise: {
      readonly detection: LevelDetection;
    };

    readonly autoOn: {
      /**
       * Автоматическое включение по освещенности.
       *
       * Если указано UNSPECIFIED, автоматическое включение по освещенности выключено.
       *
       * Если указаны другие значения, то автоматически включатся все lightings
       *  когда освещение буже ниже или равно указанному уровню.
       */
      readonly lightingLevel: LightingLevel;

      /**
       * Автоматическое включение по движению.
       */
      readonly motion: {
        /**
         * Указывается значение движения в моменте, при достижении которого будут включены все lightings.
         *
         * Если указать <= 0, то включение по движению отключается.
         */
        readonly trigger: number;

        /**
         * Диапазон времени, когда работает включение по движению.
         *
         * Если указать указать одинаковые значение (0, 0 или 15,15)
         * это будет восприниматься как диапазон [from, to + 24].
         */
        readonly active: {
          /**
           * Диапазон значений 0...23
           */
          readonly from: number;

          /**
           * Диапазон значений 0...23
           */
          readonly to: number;
        };
      };

      /**
       * Позволяет блокировать автоматическое включение
       */
      readonly block: {
        /**
         * Время блокировки autoOn по освещенности.
         *
         * Диапазон значений 0...24
         *
         * Если задано 0, то блокировка не будет включаться.
         *
         * Это нужно, чтобы была возможность вручную выключить группу,
         *  в случае когда для неё выполняется autoOn по освещенности.
         *
         * Иначе правило autoOn всегда будет перебивать ручное выключение и
         *  получится так, что кнопка нажимается, а свет продолжает гореть.
         */
        readonly illuminationHours: number;
      };
    };

    /**
     * Автоматическое выключение по движению, шуму, заданному времени.
     */
    readonly autoOff: {
      /**
       * Автоматическое выключение по освещенности.
       * Если указано UNSPECIFIED, автоматическое выключение по освещенности выключено.
       * Если указаны другие значения, то автоматически выключатся все lightings
       *  когда освещение буже выше указанного уровня.
       */
      readonly lightingLevel: LightingLevel;

      /**
       * Если значение движения ниже motion, считаем, что движения нет, диапазон значений 0...10000
       *
       * Чтобы отключить обнаружение движения, нужно установить максимальное значение.
       */
      readonly motion: number;

      /**
       * Если значение шума ниже noise, считаем, что шума нет, диапазон значений 0...10000
       *
       * Чтобы отключить обнаружение шума, нужно установить максимальное значение.
       */
      readonly noise: number;

      /**
       * Если > 0, то в случае отсутствия шума и движения группа выключится через заданное время.
       *
       * Если указать <= 0, то autoOff по шуму отключается.
       */
      readonly silenceMin: number;

      /**
       * В это время все lightings будут выключены. Событие случается единоразово.
       *
       * Диапазон значений 0...23
       *
       * Если указать значение вне диапазона, то автоматическое отключение по таймеру отключается.
       */
      readonly time: number;

      /**
       * Позволяет блокировать автоматическое выключение
       */
      readonly block: {
        /**
         * Время блокировки autoOff по освещенности.
         *
         * Если задано 0, то блокировка не будет включаться.
         *
         * Диапазон значений 0...23
         *
         * Причина такая же как и для autoOn, нужно иметь возможность включить группу
         * в момент когда этому противоречит правило по освещению.
         */
        readonly illuminationHours: number;

        /**
         * Время блокировки autoOff по ручному включению.
         */
        readonly handSwitchMin: number;
      };
    };
  };
};

/**
 * ! STATE
 */

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
  lightingLevel: LightingLevel;
  motion: number;
  noise: number;
  timeAfterNoiseDisappearedMin: number;
  timeAfterMotionDisappearedMin: number;
  /**
   * Время в часах на текущие сутки 0...23
   */
  time: number;
};

/**
 * ! PUBLIC STATE
 */

export enum LightingForce {
  ON = 'ON',
  OFF = 'OFF',
  UNSPECIFIED = 'UNSPECIFIED',
}

/**
 * Состояние макроса которое может изменить пользователь
 */
export type LightingMacrosPublicState = {
  force: LightingForce;
};

/**
 * ! FULL STATE
 */

type LightingMacrosState = LightingMacrosPrivateState & LightingMacrosPublicState;

/**
 * ! OUTPUT
 */

/**
 * Будущее состояние контролов, передается в контроллер по средством MQTT
 */
type LightingMacrosNextOutput = {
  readonly lightings: Array<{
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
const VERSION = 1;

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private nextOutput: LightingMacrosNextOutput;
  private block: {
    autoOn: {
      illumination: Date;
    };
    autoOff: {
      illumination: Date;
      /**
       * Настройка этих параметров происходит в методе setupAutoOffTime
       */
      day: [Date, Date];
    };
  };
  private lastMotionDetected = new Date();
  private lastNoseDetected = new Date();
  private clock: NodeJS.Timeout;

  constructor(parameters: LightingMacrosParameters) {
    const settings = LightingMacros.parseSettings(parameters.settings, parameters.version);
    const state = LightingMacros.parseState(parameters.state);

    super({
      eventBus: parameters.eventBus,

      type: MacrosType.LIGHTING,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: {
        force: state.force,
        switch: Switch.OFF,
        illumination: -1,
        lightingLevel: LightingLevel.UNSPECIFIED,
        motion: -1,
        noise: -1,
        timeAfterNoiseDisappearedMin: 10,
        timeAfterMotionDisappearedMin: 5,
        time: 1,
      },

      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      controlTypes: {
        switchers: ControlType.SWITCH,
        illuminations: ControlType.ILLUMINATION,
        motion: ControlType.VALUE,
        noise: ControlType.SOUND_LEVEL,
        lightings: ControlType.SWITCH,
      },

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      lightings: [],
    };

    this.block = {
      autoOn: {
        illumination: subDays(new Date(), 1),
      },
      autoOff: {
        illumination: subDays(new Date(), 1),
        day: [new Date(), new Date()],
      },
    };

    this.setupAutoOffTime();

    this.clock = setInterval(this.tic, 60 * 1000);
  }

  static parseSettings = (settings: string, version: number = VERSION): LightingMacrosSettings => {
    if (version === VERSION) {
      logger('Settings in the current version ✅');
      logger(stringify({ from: version, to: VERSION }));

      return JSON.parse(settings);
    }

    logger('Migrate settings was started 🚀');
    logger(stringify({ from: version, to: VERSION }));

    const mappers = [settings_to_1, settings_from_1_to_2].slice(version, VERSION + 1);

    logger(mappers);

    const result = mappers.reduce((accumulator, mapper) => mapper(accumulator), JSON.parse(settings));

    logger(stringify(result));
    logger('Migrate settings was finished ✅');

    return result;
  };

  static parseState = (state?: string): LightingMacrosPublicState => {
    if (!state) {
      return {
        force: LightingForce.UNSPECIFIED,
      };
    }
    /**
     * TODO Проверять через JSON Schema
     */

    return JSON.parse(state);
  };

  setState = (nextPublicState: string): void => {
    const nextState: LightingMacrosPublicState = LightingMacros.parseState(nextPublicState);

    logger('The next state was appeared ⏭️ ⏭️ ⏭️');
    logger(
      stringify({
        currentState: this.state,
        nextState,
      }),
    );

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
        logger('An incorrect state was received 🚨');
        logger(stringify({ name: this.name, currentState: this.state, nextState }));

        return;
      }
    }

    logger('The next state was applied ⏭️ ✅ ⏭️');
    logger(
      stringify({
        currentState: this.state,
        nextState,
      }),
    );

    this.execute();
  };

  /**
   * ! PUBLIC STATE
   */
  protected applyPublicState = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      const control = this.getFirstLightingControl();

      if (!control) {
        logger('Not a single lamp will be found 🚨');

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

      if (this.nextOutput.lightings.length > 0) {
        logger('The force state was determined 🫡 😡 😤 🚀');
        logger(
          stringify({
            name: this.name,
            currentState: this.state,
            nextSwitchState,
            nextOutput: this.nextOutput,
          }),
        );

        this.state.switch = nextSwitchState;

        this.applyOutput();
      }

      return true;
    }

    return false;
  };

  /**
   * ! INPUT
   */
  protected applyInput() {
    const currentSwitchState = this.state.switch;

    this.applySwitch();
    this.applyAutoOn();
    this.applyAutoOff();

    if (currentSwitchState !== this.state.switch) {
      this.computeOutput();
      this.applyOutput();

      return true;
    }

    return false;
  }

  /**
   * ! SWITCH
   *
   * Обработка состояния переключателя, в роли переключателя может быть: кнопка, герметичный контакт, реле.
   */
  private applySwitch = () => {
    let isSwitchHasBeenChange = false;
    let trigger: Trigger = Trigger.UP;

    if (this.settings.properties.switcher.trigger === Trigger.UP) {
      isSwitchHasBeenChange = this.isSwitchHasBeenUp();

      trigger = Trigger.UP;
    }

    if (this.settings.properties.switcher.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      trigger = Trigger.DOWN;
    }

    if (isSwitchHasBeenChange) {
      if (trigger === Trigger.UP) {
        logger('The switch would be closed 🔒');
      }

      if (trigger === Trigger.DOWN) {
        logger('The switch was open 🔓');
      }

      const control = this.getFirstLightingControl();

      if (!control) {
        logger('Not a single lamp will be found 🚨');

        return;
      }

      logger(stringify({ name: this.name, currentState: this.state, on: control.on, off: control.off }));

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
        logger('No handler found for the current state 🚨');
        logger(stringify({ name: this.name, currentState: this.state }));

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
          this.block.autoOn.illumination = addHours(
            new Date(),
            this.settings.properties.autoOn.block.illuminationHours,
          );

          logger('The auto ON block was activated ✅');
          logger(
            stringify({
              autoOnBlockedFor: format(this.block.autoOn.illumination, 'yyyy.MM.dd HH:mm:ss OOOO'),
            }),
          );
        }

        if (nextSwitchState === Switch.ON) {
          logger('The auto OFF block was activated ✅');

          this.block.autoOff.illumination = addHours(
            new Date(),
            this.settings.properties.autoOff.block.illuminationHours,
          );

          this.block.autoOff.illumination = addMinutes(
            this.block.autoOff.illumination,
            this.settings.properties.autoOff.block.handSwitchMin,
          );

          logger(
            stringify({
              autoOffBlockedFor: format(this.block.autoOff.illumination, 'yyyy.MM.dd HH:mm:ss OOOO'),
            }),
          );
        }

        this.state.switch = nextSwitchState;
      }
    }
  };

  /**
   * ! AUTO_ON
   */
  private applyAutoOn = () => {
    /**
     * ! Pre flight check
     */
    const isAutoOnBlocked = compareAsc(this.block.autoOn.illumination, new Date()) === 1;
    const isAlreadyOn = this.state.switch === Switch.ON;
    const isLightingLevelDefined = this.state.lightingLevel !== LightingLevel.UNSPECIFIED;

    if (isAutoOnBlocked || isAlreadyOn || !isLightingLevelDefined) {
      return;
    }

    /**
     * ! Devices
     */
    const hasIlluminationDevice = this.settings.devices.illuminations.length > 0;
    const hasMotionDevice = this.settings.devices.motion.length > 0;

    /**
     * ! Settings
     */
    const { lightingLevel, motion } = this.settings.properties.autoOn;

    let nextSwitchState: Switch = this.state.switch;

    /**
     * ! AutoOn по датчикам освещенности.
     *
     * * При наличии датчиков движения, освещенность становится фактором блокировки включения,
     * * то есть пока не потемнеет, группа не будет включена даже если есть движение.
     */
    const autoOnByIllumination =
      hasIlluminationDevice && isLightingLevelDefined && this.state.lightingLevel <= lightingLevel;

    /**
     * * Если есть датчики движения отсутствуют, можно включить группу без проверки движения.
     */
    if (autoOnByIllumination && !hasMotionDevice) {
      nextSwitchState = Switch.ON;
    }

    /**
     * ! AutoOn по датчикам движения
     */
    const { trigger, active } = motion;

    const hasMotionTrigger = Number.isInteger(trigger) && trigger > 0;

    const motionDetected = this.state.motion >= trigger;

    /**
     * Если имеются датчики освещенности, то учитывается значение освещенности перед проверкой движения.
     */
    const autoOnByMotion = hasIlluminationDevice
      ? hasMotionDevice && autoOnByIllumination && hasMotionTrigger && motionDetected
      : hasMotionDevice && hasMotionTrigger && motionDetected;

    const isPartTimeActive = active.from >= 0 && active.from <= 23 && active.to >= 0 && active.to <= 23;

    if (autoOnByMotion) {
      if (isPartTimeActive) {
        if (this.hasHourOverlap(active.from, active.to)) {
          nextSwitchState = Switch.ON;
        }
      } else {
        nextSwitchState = Switch.ON;
      }
    }

    if (nextSwitchState !== this.state.switch) {
      logger('The AUTO ON change state 🪄');
      logger(
        stringify({
          name: this.name,

          isAutoOnBlocked,
          isAlreadyOn,
          isLightingLevelDefined,

          hasIlluminationDevice,
          hasMotionDevice,

          lightingLevelProperty: lightingLevel,
          lightingLevelState: this.state.lightingLevel,
          autoOnByIllumination,

          motionTriggerProperty: trigger,
          motionState: this.state.motion,

          motionActiveTimeRange: active,

          hasMotionTrigger,
          motionDetected,
          autoOnByMotion,
          isPartTimeActive,
          hasHourOverlap: this.hasHourOverlap(active.from, active.to),

          nextSwitchState,

          state: this.state,
        }),
      );

      this.state.switch = nextSwitchState;
    }
  };

  /**
   * ! AUTO_OFF
   */
  private applyAutoOff = () => {
    /**
     * ! Pre flight check
     */
    const isAutoOffBlocked = compareAsc(this.block.autoOff.illumination, new Date()) === 1;
    const isAlreadyOff = this.state.switch === Switch.OFF;
    const isLightingLevelDefined = this.state.lightingLevel !== LightingLevel.UNSPECIFIED;

    if (isAutoOffBlocked || isAlreadyOff || !isLightingLevelDefined) {
      return;
    }

    /**
     * ! Devices
     */
    const { illuminations, motion, noise } = this.settings.devices;

    const hasIlluminationDevice = illuminations.length > 0;
    const hasMotionDevice = motion.length > 0;
    const hasNoiseDevice = noise.length > 0;

    /**
     * ! Properties
     */
    const { lightingLevel, silenceMin } = this.settings.properties.autoOff;

    let nextSwitchState: Switch = this.state.switch;

    /**
     * ! AutoOff по датчикам освещенности, как только освещенность превышает заданный порог, группа будет выключена.
     *
     * Работает когда имеются датчики освещенности.
     */
    const autoOffByIllumination =
      hasIlluminationDevice && isLightingLevelDefined && this.state.lightingLevel >= lightingLevel;

    if (autoOffByIllumination) {
      nextSwitchState = Switch.OFF;
    }

    /**
     * ! AutoOff по датчикам движения и звука, как только пропадает движение и шум группа будет выключена.
     *
     * Работает когда имеются датчики движения.
     */
    const isSilence =
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      compareAsc(new Date(), addMinutes(new Date(this.lastMotionDetected.getTime()), silenceMin)) === 1 &&
      compareAsc(new Date(), addMinutes(new Date(this.lastNoseDetected.getTime()), silenceMin)) === 1;

    const autoOffByMovementAndNoise = (hasMotionDevice || hasNoiseDevice) && isSilence;

    if (autoOffByMovementAndNoise) {
      nextSwitchState = Switch.OFF;
    }

    if (nextSwitchState !== this.state.switch) {
      logger('The AUTO OFF change state 🪄');
      logger(
        stringify({
          name: this.name,

          isAutoOffBlocked,
          isAlreadyOff,
          isLightingLevelDefined,

          hasIlluminationDevice,
          hasMotionDevice,
          hasNoiseDevice,

          lightingLevelSettings: lightingLevel,
          lightingLevelState: this.state.lightingLevel,

          lastMotionDetected: this.lastMotionDetected,
          lastNoseDetected: this.lastNoseDetected,

          autoOffByIllumination,

          silenceMin,
          isSilence,

          autoOffByMovementAndNoise,

          nextSwitchState,

          state: this.state,
        }),
      );

      this.state.switch = nextSwitchState;
    }
  };

  /**
   * ! EXTERNAL_VALUE
   */
  protected applyExternalValue() {
    this.applyExternalSwitchersState();
    this.applyExternalIlluminationSate();
    this.applyExternalMotionSate();
    this.applyExternalNoiseSate();
  }

  private applyExternalSwitchersState = () => {
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

    logger('The internal state has been changed because one of the managed controls has changed state 🍋');
    logger(
      stringify({
        name: this.name,
        isSomeOn,
        nextState,
        lightings: this.settings.devices.lightings.map((lighting) => {
          return {
            value: this.controls.get(getControlId(lighting))?.value,
          };
        }),
        state: this.state,
      }),
    );

    this.state.switch = nextState;
  };

  private applyExternalIlluminationSate = () => {
    const { LOW, MIDDLE, HIGHT, detection } = this.settings.properties.illumination;

    const illumination = this.getValueByDetection(this.settings.devices.illuminations, detection);

    let lightingLevel = LightingLevel.UNSPECIFIED;

    if (illumination <= LOW) {
      lightingLevel = LightingLevel.LOW;
    }

    if (illumination > LOW && illumination <= MIDDLE) {
      lightingLevel = LightingLevel.MIDDLE;
    }

    if (illumination > MIDDLE) {
      lightingLevel = LightingLevel.HIGHT;
    }

    if (illumination > HIGHT) {
      lightingLevel = LightingLevel.MAX;
    }

    if (lightingLevel === LightingLevel.UNSPECIFIED) {
      logger('The light level could not be determined 🚨');
      logger(
        stringify({
          name: this.name,
          settings: {
            illumination: this.settings.properties.illumination,
          },
          illumination,
          lightingLevel,
        }),
      );
    }

    this.state.illumination = illumination;
    this.state.lightingLevel = lightingLevel;
  };

  private applyExternalMotionSate = () => {
    this.state.motion = this.getValueByDetection(
      this.settings.devices.motion,
      this.settings.properties.motion.detection,
    );

    if (this.state.motion >= this.settings.properties.autoOff.motion) {
      this.lastMotionDetected = new Date();
    }
  };

  private applyExternalNoiseSate = () => {
    this.state.noise = this.getValueByDetection(this.settings.devices.noise, this.settings.properties.noise.detection);

    if (this.state.noise >= this.settings.properties.autoOff.noise) {
      this.lastNoseDetected = new Date();
    }
  };

  /**
   * ! COMPUTE
   */
  protected computeOutput() {
    const nextOutput: LightingMacrosNextOutput = {
      lightings: [],
    };

    for (const { deviceId, controlId } of this.settings.devices.lightings) {
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

      let value = control.off;

      if (this.state.switch === 'ON') {
        value = control.on;
      }

      if (this.state.switch === 'OFF') {
        value = control.off;
      }

      if (control.value !== value) {
        nextOutput.lightings.push({
          deviceId,
          controlId,
          value,
        });
      }
    }

    this.nextOutput = nextOutput;

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  }

  /**
   * ! APPLY
   */
  protected applyOutput() {
    for (const lighting of this.nextOutput.lightings) {
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

      const { topic } = hyperionControl;
      const message = lighting.value;

      logger('The message has been created and will be sent to the wirenboard controller ⬆️ 📟 📟 📟 ⬆️');
      logger(
        stringify({
          name: this.name,
          topic,
          message,
        }),
      );

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }
  }

  /**
   * ! DESTROY
   */
  protected destroy() {
    clearInterval(this.clock);
  }

  /**
   * ! INTERNAL_IMPLEMENTATION
   */

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.devices.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.devices.switchers);
  }

  private getValueByDetection = (
    devices: Array<{ deviceId: string; controlId: string }>,
    detection: LevelDetection,
  ) => {
    let result = -1;

    for (const { deviceId, controlId } of devices) {
      const control = this.controls.get(getControlId({ deviceId, controlId }));

      if (control) {
        const value = Number(control.value);

        if (result === -1) {
          result = value;

          continue;
        }

        if (detection === LevelDetection.MAX && value > result) {
          result = value;
        }

        if (detection === LevelDetection.MIN && value < result) {
          result = value;
        }

        if (detection === LevelDetection.AVG) {
          result += value;
        }
      }
    }

    if (detection === LevelDetection.AVG) {
      result = result / devices.length;
    }

    return result;
  };

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
     * time - количество часов указано в временной зоне клиента
     */
    const { time } = this.settings.properties.autoOff;

    /**
     * Если time не в диапазоне 0 - 23, не выполняем отключение по времени
     */
    if (time < 0 || time > 23) {
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

    this.block.autoOff.day = [from, to];

    logger({
      name: this.name,
      message: 'Setup tic tak ⏱️',
      now,
      year,
      month,
      date,

      day: this.block.autoOff.day,

      time,
      hours,
    });

    /**
     * Если в момент старта сервиса 15 часов, а time установлен как 13, то нужно передвинуть диапазон на сутки вперед,
     * и событие по отключению произойдет на следующие сутки в 13 часов.
     *
     * Если в момент старта сервиса 15 часов, а time установлен на 23 часа, то останутся текущие сутки.
     *
     * Если в момент старта сервиса 15 часов, а time установлен на 0, то нужно передвинуть диапазон на сутки вперед,
     * и событие по отключению произойдет на следующие сутки в 0 часов.
     */
    if (hours > time) {
      const [from, to] = this.block.autoOff.day;

      this.block.autoOff.day = [addDays(from, 1), addDays(to, 1)];
    }
  };

  /**
   * Обработчик счетчика часов, в рамках этого обработчика, будут случаться
   * все действия связанные с течением времени.
   */
  private tic = () => {
    /**
     * time - количество часов указано в временной зоне клиента
     */
    const { time } = this.settings.properties.autoOff;

    /**
     * Если time не в диапазоне 0 - 23, не выполняем отключение по времени
     */
    if (time < 0 || time > 23) {
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
    const [from, to] = this.block.autoOff.day;

    const timeHasCome = hours === time;
    const hasOverlapMomentAndDay = now.getTime() >= from.getTime() && now.getTime() <= to.getTime();

    // logger({
    //   name: this.name,
    //   message: 'Tic tac ⏱️',
    //   from,
    //   fromMs: from.getTime(),
    //   to,
    //   toMs: to.getTime(),
    //   now,
    //   nowMs: now.getTime(),
    //   hours,
    //   time,
    //   timeHasCome,
    //   hasOverlapMomentAndDay,
    //   state: this.state,
    // });

    if (timeHasCome && hasOverlapMomentAndDay) {
      this.block.autoOff.day = [addDays(from, 1), addDays(to, 1)];

      if (this.state.switch === Switch.ON) {
        this.state.switch = Switch.OFF;

        logger('The switch state was changed by clock 🪄');
        logger(stringify(this.state));

        this.block.autoOn.illumination = addHours(new Date(), this.settings.properties.autoOn.block.illuminationHours);

        logger('The auto ON block was activated ✅');
        logger(
          stringify({
            autoOnBlockedFor: format(this.block.autoOn.illumination, 'yyyy.MM.dd HH:mm:ss OOOO'),
          }),
        );

        this.computeOutput();
        this.applyOutput();
      }
    }
  };
}

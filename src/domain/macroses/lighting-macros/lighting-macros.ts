import { addDays, addHours, addMinutes, compareAsc, subDays } from 'date-fns';
import debug from 'debug';

import { stringify } from '../../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../../control-type';
import { HyperionDeviceControl } from '../../hyperion-control';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../macros-showcase';

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
 * ! Сценарии
 *
 * 1. Изменение состояния через switchers, по умолчанию "UP" (в момент нажатия кнопки).
 *  1.1. Значение реакции на переключатель можно настраивать,
 *   UP (контакт переключателя замкнут),
 *   DOWN (контакт переключателя разомкнут, после того как был замкнут)
 *  1.2. Если в lightings есть хотя бы один включенный светильник, то при реакции на switchers, произойдет включение
 *   отключенных светильников, иначе все светильники выключатся.
 *    1.2.1. Функциональность можно отключать, и переключение будет происходить по внутреннему состоянию макроса.
 *  1.3. В зависимости от illuminations определяется значение LightingLevel.
 *   1.3.1. Можно указать какое значение брать: (максимальное, минимальное_ хотя бы у одного, среднее между всеми.
 *   1.3.2. Можно указать, при каком LightingLevel включать все lightings.
 * 2. Если движение поднимается выше порога, происходит включение всех lightings в рамках макроса.
 *  2.1. Работает в заданном диапазоне времени, если не задано, то работает все время.
 * 3. Если освещение станет ниже установленного порога, включатся все lightings в рамках макроса.
 * 4. Если движение и шум отсутствует в течении заданного времени, lightings выключаются.
 * 5. Если движение отсутствует, но шум присутствует в течении заданного времени все lightings выключаются.ё
 * 6. Если задано время отключения, то при достижении этого времени, все lightings выключаются.
 * 7. Если задано время блокировки autoOn по освещенности, то при выключении такой группы, автоматическое включение по
 *  освещению заблокируется на заданное кол-во часов.
 * 8. Если задано время блокировки autoOff по освещенности, то при включении такой группы в момент когда освещенность
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
       * UP - переключатель нажали/замкнули
       * DOWN - переключатель отпустили/разомкнули
       */
      readonly trigger: Trigger;
      /**
       * Позволяет отключить функционал до включения выключенных lightings.
       */
      readonly everyOn: boolean;
    };

    readonly illumination: {
      /**
       * Настройка освещенности для каждого уровня. Чтобы понять какие значения выставлять, нужно посмотреть
       * какие значения дают датчики в нужных местах в разное время суток.
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
       * Если указано UNSPECIFIED, автоматическое включение по освещенности выключено.
       * Если указаны другие значения, то автоматически включатся все lightings
       *  когда освещение буже ниже или равно указанному уровню.
       */
      readonly illumination: LightingLevel;

      /**
       * Автоматическое включение по движению.
       */
      readonly motion: {
        /**
         * Указывается значение движения в моменте, при достижении которого будут включены все lightings.
         * Если указать <= 0, то включение по движению отключается.
         */
        readonly trigger: number;

        /**
         * Диапазон времени, когда работает включение по движению.
         * Если указать нули, то работает все время.
         */
        readonly active: {
          /**
           * 0...23
           */
          readonly from: number;

          /**
           * 0...23
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
      readonly illumination: LightingLevel;

      /**
       * Если значение движения ниже motion, считаем, что движения нет, если указать 0, то движение не учитывается.
       */
      readonly motion: number;

      /**
       * Если значение шума ниже noise, считаем, что шума нет, если указать 0, то шум не учитывается.
       */
      readonly noise: number;

      /**
       * Если движение отсутствует в течении заданного времени, lightings выключаются.
       * Если указать <= 0, то autoOff по движению отключается.
       */
      readonly motionMin: number;

      /**
       * Если шум отсутствует, в течении заданного времени, lightings выключаются.
       * Если указать <= 0, то autoOff по шуму отключается.
       */
      readonly noiseMin: number;

      /**
       * Если > 0, то в случае отсутствия шума и движения группа выключится через заданное время.
       * Если указать <= 0, то autoOff по шуму отключается.
       */
      readonly silenceMin: number;

      /**
       * В это время все lightings будут выключены. Событие случается единоразово.
       * 0...23
       * Если указать -1 или меньше, то автоматическое отключение по таймеру отключается.
       */
      readonly time: number;

      /**
       * Позволяет блокировать автоматическое выключение
       */
      readonly block: {
        /**
         * Время блокировки autoOff по освещенности.
         * Если задано 0, то блокировка не будет включаться.
         *
         * Причина такая же как и для autoOn, нужно иметь возможность включить группу
         *  в момент когда этому противоречит правило по освещению.
         */
        readonly illuminationHours: number;
      };
    };
  };
};

/**
 * ! STATE
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

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private nextOutput: LightingMacrosNextOutput;
  private block: {
    autoOn: {
      illumination: Date;
    };
    autoOff: {
      illumination: Date;
      day: [Date, Date];
    };
  };
  private lastMotionDetected = new Date();
  private lastNoseDetected = new Date();
  private clock: NodeJS.Timeout;

  constructor(parameters: LightingMacrosParameters) {
    const settings = LightingMacros.parseSettings(parameters.settings);
    const state = LightingMacros.parseState(parameters.state);

    super({
      ...parameters,
      type: MacrosType.LIGHTING,
      settings,
      state: {
        force: state.force,
        switch: Switch.OFF,
        illumination: 0,
        lightingLevel: LightingLevel.UNSPECIFIED,
        motion: 0,
        noise: 0,
        timeAfterNoiseDisappearedMin: 10,
        timeAfterMotionDisappearedMin: 5,
        time: 1,
      },
      controlTypes: {
        switchers: ControlType.SWITCH,
        illuminations: ControlType.ILLUMINATION,
        motion: ControlType.VALUE,
        noise: ControlType.VALUE,
        lightings: ControlType.SWITCH,
      },
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

  static parseSettings = (settings: string): LightingMacrosSettings => {
    /**
     * TODO Проверять через JSON Schema
     */

    return JSON.parse(settings);
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

  protected applyStateToOutput = () => {
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

      this.computeNextOutput();

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

        this.applyNextOutput();
      }

      return true;
    }

    return false;
  };

  protected applyInputToState() {
    const stop = this.applyInputSwitchState();

    if (!stop) {
      const currentSwitchState = this.state.switch;

      this.applyAutoOn();
      this.applyAutoOff();

      if (currentSwitchState !== this.state.switch) {
        this.computeNextOutput();
        this.applyNextOutput();

        return true;
      }
    }

    return stop;
  }

  /**
   * Обработка состояния переключателя, в роли переключателя может быть: кнопка, герметичный контакт, реле.
   */
  private applyInputSwitchState = () => {
    let isSwitchHasBeenChange = false;

    if (this.settings.properties.switcher.trigger === Trigger.UP) {
      logger('The switch would be closed 🔒');

      isSwitchHasBeenChange = this.isSwitchHasBeenUp();
    }

    if (this.settings.properties.switcher.trigger === Trigger.DOWN) {
      logger('The switch was open 🔓');

      isSwitchHasBeenChange = this.isSwitchHasBeenDown();
    }

    if (isSwitchHasBeenChange) {
      const control = this.getFirstLightingControl();

      if (!control) {
        logger('Not a single lamp will be found 🚨');

        return false;
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
         */
        if (nextSwitchState === Switch.OFF) {
          this.block.autoOn.illumination = addHours(
            new Date(),
            this.settings.properties.autoOn.block.illuminationHours,
          );
        }

        if (nextSwitchState === Switch.ON) {
          this.block.autoOff.illumination = addHours(
            new Date(),
            this.settings.properties.autoOff.block.illuminationHours,
          );
        }

        this.state.switch = nextSwitchState;

        this.computeNextOutput();
        this.applyNextOutput();
      }

      return true;
    }

    return false;
  };

  private applyAutoOn = () => {
    let nextSwitchState = this.state.switch;

    const { illumination, motion } = this.settings.properties.autoOn;

    /**
     * AutoOn по датчикам освещенности.
     */
    if (
      illumination !== LightingLevel.UNSPECIFIED &&
      this.state.lightingLevel < illumination &&
      compareAsc(this.block.autoOn.illumination, new Date()) === -1
    ) {
      nextSwitchState = Switch.ON;
    }

    /**
     * AutoOn по датчикам движения.
     */
    const { trigger, active } = motion;

    if (trigger > 0 && this.state.motion >= trigger) {
      const isPartTimeActive = active.from >= 0 && active.from <= 23 && active.to >= 0 && active.to <= 23;

      if (isPartTimeActive) {
        if (this.hasHourOverlap(active.from, active.to)) {
          nextSwitchState = Switch.ON;
        }
      } else {
        nextSwitchState = Switch.ON;
      }
    }

    if (nextSwitchState !== this.state.switch) {
      logger('The auto on change state 🪄');
      logger(stringify({ illumination, motion, state: this.state }));

      this.state.switch = nextSwitchState;
    }
  };

  private applyAutoOff = () => {
    const { illumination, motionMin, noiseMin, silenceMin } = this.settings.properties.autoOff;

    let nextSwitchState = this.state.switch;

    /**
     * AutoOff по датчикам освещенности
     */
    if (
      illumination !== LightingLevel.UNSPECIFIED &&
      this.state.lightingLevel >= illumination &&
      compareAsc(this.block.autoOff.illumination, new Date()) === -1
    ) {
      nextSwitchState = Switch.OFF;
    }

    /**
     * AutoOff по датчикам движения и звука
     */
    const isSilence =
      silenceMin > 0 &&
      compareAsc(new Date(), addMinutes(this.lastMotionDetected, silenceMin)) === 1 &&
      compareAsc(new Date(), addMinutes(this.lastNoseDetected, silenceMin));

    const isNoMovement = motionMin > 0 && compareAsc(new Date(), addMinutes(this.lastMotionDetected, motionMin)) === 1;
    const isNoNoise = noiseMin > 0 && compareAsc(new Date(), addMinutes(this.lastNoseDetected, noiseMin)) === 1;

    if (isSilence || isNoMovement || isNoNoise) {
      nextSwitchState = Switch.OFF;
    }

    if (nextSwitchState !== this.state.switch) {
      logger('The auto off change state 🪄');
      logger(stringify({ isSilence, isNoMovement, isNoNoise, state: this.state }));

      this.state.switch = nextSwitchState;
    }
  };

  protected applyExternalToState() {
    this.applyExternalSwitchersState();
    this.applyExternalIlluminationSate();
    this.applyExternalMotionSate();
    this.applyExternalNoiseSate();
  }

  private applyExternalSwitchersState = () => {
    /**
     * Актуализация состояния освещения по внешнему состоянию каждого светильника
     */
    const isSomeOn = this.settings.devices.lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      if (control) {
        return control.value === control.on;
      }

      return false;
    });

    const nextState: Switch = isSomeOn ? Switch.ON : Switch.OFF;

    const loggerContext = stringify({
      name: this.name,
      currentState: this.state,
      lightings: this.settings.devices.lightings.map((lighting) => {
        return {
          value: this.controls.get(getControlId(lighting))?.value,
        };
      }),
      isSomeOn,
      nextState,
    });

    if (this.state.switch === nextState) {
      return;
    }

    logger('The internal state has been changed because one of the managed controls has changed state 🍋');
    logger(loggerContext);

    this.state.switch = nextState;
  };

  private applyExternalIlluminationSate = () => {
    const illumination = this.getValueByDetection(
      this.settings.devices.illuminations,
      this.settings.properties.illumination.detection,
    );

    let lightingLevel = LightingLevel.UNSPECIFIED;

    if (illumination > this.settings.properties.illumination.HIGHT) {
      lightingLevel = LightingLevel.HIGHT;
    }

    if (
      illumination < this.settings.properties.illumination.HIGHT &&
      illumination >= this.settings.properties.illumination.MIDDLE
    ) {
      lightingLevel = LightingLevel.MIDDLE;
    }

    if (illumination < this.settings.properties.illumination.LOW) {
      lightingLevel = LightingLevel.LOW;
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
      this.lastMotionDetected = new Date();
    }
  };

  protected computeNextOutput() {
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

  protected applyNextOutput() {
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

  protected destroy() {
    clearInterval(this.clock);
  }

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

  private setupAutoOffTime = () => {
    const { time } = this.settings.properties.autoOff;

    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const date = new Date().getDate();
    const hours = new Date().getHours();

    this.block.autoOff.day = [new Date(year, month, date, 0, 0, 0, 0), new Date(year, month, date, 24, 0, 0, 0)];

    if (time >= 0 && hours > time) {
      const [from, to] = this.block.autoOff.day;

      this.block.autoOff.day = [addDays(from, 1), addDays(to, 1)];
    }
  };

  /**
   * Обработчик счетчика часов, в рамках этого обработчика, будут случаться
   * все действия связанные с течением времени.
   */
  private tic = () => {
    const now = Date.now();
    const hours = new Date().getHours();

    const [from, to] = this.block.autoOff.day;

    const { time } = this.settings.properties.autoOff;

    if (from.getTime() >= now && now <= to.getTime() && time === hours) {
      this.block.autoOff.day = [addDays(from, 1), addDays(to, 1)];

      const nextSwitchState = Switch.OFF;

      if (this.state.switch !== nextSwitchState) {
        this.state.switch = nextSwitchState;

        logger('The switch state was changed by clock 🪄');
        logger(stringify(this.state));

        this.computeNextOutput();
        this.applyNextOutput();
      }
    }
  };
}

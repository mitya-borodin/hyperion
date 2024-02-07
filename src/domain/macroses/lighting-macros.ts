import { addHours, compareAsc, subDays } from 'date-fns';
import debug from 'debug';

import { stringify } from '../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';

import { getControlId } from './get-control-id';
import { Macros, MacrosParameters, MacrosType } from './macros';

const logger = debug('hyperion-lighting-macros');

/**
 * ! SETTINGS
 */

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
 */
export type LightingMacrosSettings = {
  /**
   * Список устройств которые участвую в макросе
   */
  devices: {
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
  properties: {
    switcher: {
      /**
       * Переключает реакцию на положение переключателя
       * UP - переключатель нажали/замкнули
       * DOWN - переключатель отпустили/разомкнули
       */
      trigger: 'UP' | 'DOWN';
      /**
       * Позволяет отключить функционал до включения выключенных lightings.
       */
      everyOn: boolean;
    };

    illumination: {
      /**
       * Настройка освещенности для каждого уровня. Чтобы понять какие значения выставлять, нужно посмотреть
       * какие значения дают датчики в нужных местах в разное время суток.
       */
      [LightingLevel.HIGHT]: number;
      [LightingLevel.MIDDLE]: number;
      [LightingLevel.LOW]: number;

      detection: LevelDetection;
    };

    motion: {
      detection: LevelDetection;
    };

    noise: {
      detection: LevelDetection;
    };

    autoOn: {
      /**
       * Автоматическое включение по освещенности.
       * Если указано UNSPECIFIED, автоматическое включение по освещенности выключено.
       * Если указаны другие значения, то автоматически включатся все lightings
       *  когда освещение буже ниже или равно указанному уровню.
       */
      illumination: LightingLevel;

      /**
       * Автоматическое включение по движению.
       */
      motion: {
        /**
         * Указывается значение движения в моменте, при достижении которого будут включены все lightings.
         * Если указать 0, то включение по движению отключается.
         */
        trigger: number;

        /**
         * Диапазон времени, когда работает включение по движению.
         * Если указать нули, то работает все время.
         */
        active: {
          /**
           * 0...23
           */
          from: number;

          /**
           * 0...23
           */
          to: number;
        };
      };
    };

    /**
     * Автоматическое выключение по движению, шуму, заданному времени.
     */
    autoOff: {
      /**
       * Автоматическое выключение по освещенности.
       * Если указано UNSPECIFIED, автоматическое выключение по освещенности выключено.
       * Если указаны другие значения, то автоматически выключатся все lightings
       *  когда освещение буже выше указанного уровня.
       */
      illumination: LightingLevel;

      /**
       * Если значение движения ниже motion, считаем, что движения нет, если указать 0, то движение не учитывается.
       */
      motion: number;

      /**
       * Если значение шума ниже noise, считаем, что шума нет, если указать 0, то шум не учитывается.
       */
      noise: number;

      /**
       * Если движение и шум отсутствует в течении заданного времени, lightings выключаются.
       * Если указать 0, то автоматическое отключение по движению и шуму отключается.
       */
      motionAndNoiseTimerMin: number;

      /**
       * Если движение отсутствует, но шум присутствует в течении заданного времени все lightings выключаются.
       * Если указать 0, то автоматическое отключение по шуму отключается.
       */
      onlyNoiseTimerMin: number;

      /**
       * В это время все lightings будут выключены. Событие случается единоразово.
       * 0...23
       * Если указать -1, то автоматическое отключение по таймеру отключается.
       */
      time: number;
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
  switch: 'ON' | 'OFF';
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
 * Будущее состояние контроллера
 */
type LightingMacrosNextOutput = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = MacrosParameters<LightingMacrosSettings, LightingMacrosPublicState>;

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private nextOutput: LightingMacrosNextOutput;
  private block: {
    autoOn: {
      illumination: Date;
    };
    autoOff: {
      illumination: Date;
    };
  };

  constructor(parameters: LightingMacrosParameters) {
    super({
      ...parameters,
      type: MacrosType.LIGHTING,
      state: {
        force: parameters.state.force,
        switch: 'OFF',
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
      },
    };
  }

  setState = (nextState: LightingMacrosPublicState): void => {
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

      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = control.off;

      if (this.state.force === 'ON') {
        nextSwitchState = 'ON';
        nextValue = control.on;
      }

      if (this.state.force === 'OFF') {
        nextSwitchState = 'OFF';
        nextValue = control.off;
      }

      this.computeNextOutput(nextValue);

      if (this.nextOutput.lightings.length > 0) {
        logger('The force state was determined 🫡 😡 😤 🚀');
        logger(
          stringify({
            name: this.name,
            currentState: this.state,
            nextSwitchState,
            nextValue,
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
      this.applyAutoOn();
      this.applyAutoOff();
    }

    return stop;
  }

  /**
   * Обработка состояния переключателя, в роли переключателя может быть: кнопка, герметичный контакт, реле.
   */
  private applyInputSwitchState = () => {
    let isSwitchHasBeenChange = false;

    if (this.settings.properties.switcher.trigger === 'UP') {
      logger('The switch would be closed 🔒');

      isSwitchHasBeenChange = this.isSwitchHasBeenUp();
    }

    if (this.settings.properties.switcher.trigger === 'DOWN') {
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

      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = control.off;

      if (this.state.switch === 'ON') {
        if (this.settings.properties.switcher.everyOn) {
          /**
           * ! Если хотя бы один контрол из группы включен, то при первом клике, нужно включить все остальные, а
           * ! при втором клике все выключаем.
           */
          const everyOn = this.settings.devices.lightings.every((lighting) => {
            const control = this.controls.get(getControlId(lighting));

            return control?.value === control?.on;
          });

          if (everyOn) {
            nextSwitchState = 'OFF';
            nextValue = control.off;
          } else {
            nextSwitchState = 'ON';
            nextValue = control.on;
          }
        } else {
          nextSwitchState = 'OFF';
          nextValue = control.off;
        }
      } else if (this.state.switch === 'OFF') {
        nextSwitchState = 'ON';
        nextValue = control.on;
      } else {
        logger('No handler found for the current state 🚨');
        logger(stringify({ name: this.name, currentState: this.state }));

        nextSwitchState = 'OFF';
        nextValue = control.on;
      }

      if (this.state.switch !== nextSwitchState) {
        this.block.autoOn.illumination = addHours(new Date(), 12);

        this.state.switch = nextSwitchState;

        this.computeNextOutput(nextValue);
        this.applyNextOutput();
      }

      return true;
    }

    return false;
  };

  private applyAutoOn = () => {
    const { illumination, motion } = this.settings.properties.autoOn;

    let nextSwitchState = this.state.switch;

    if (
      illumination !== LightingLevel.UNSPECIFIED &&
      this.state.lightingLevel <= illumination &&
      /**
       * Блокировка включения по освещению
       */
      compareAsc(this.block.autoOn.illumination, new Date()) === -1
    ) {
      nextSwitchState = 'ON';
    }

    if (motion.trigger > 0 && this.state.motion >= motion.trigger) {
      const partTime =
        motion.active.from >= 0 && motion.active.from <= 23 && motion.active.to >= 0 && motion.active.to <= 23;

      if (partTime) {
        if (this.hasHourOverlap(motion.active.from, motion.active.to)) {
          nextSwitchState = 'ON';
        }
      } else {
        nextSwitchState = 'ON';
      }
    }

    if (nextSwitchState !== this.state.switch) {
      // ! Нужно вычислить следующее состояние контроллера
    }
  };

  private applyAutoOff = () => {
    const { motion, noise, motionAndNoiseTimerMin, onlyNoiseTimerMin, time } = this.settings.properties.autoOff;
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

    const nextState = isSomeOn ? 'ON' : 'OFF';

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

    if (illumination > this.settings.properties.illumination[LightingLevel.HIGHT]) {
      lightingLevel = LightingLevel.HIGHT;
    }

    if (
      illumination < this.settings.properties.illumination[LightingLevel.HIGHT] &&
      illumination >= this.settings.properties.illumination[LightingLevel.MIDDLE]
    ) {
      lightingLevel = LightingLevel.MIDDLE;
    }

    if (illumination < this.settings.properties.illumination[LightingLevel.LOW]) {
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
  };

  private applyExternalNoiseSate = () => {
    this.state.noise = this.getValueByDetection(this.settings.devices.noise, this.settings.properties.noise.detection);
  };

  protected computeNextOutput(value: string) {
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
}

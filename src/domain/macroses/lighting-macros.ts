import debug from 'debug';

import { stringify } from '../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../control-type';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { Macros, MacrosAccept, MacrosParameters, MacrosType } from './macros';

const logger = debug('hyperion-lighting-macros');

/**
 * ! SETTINGS
 */
export enum LightingLevel {
  UNSPECIFIED = 'UNSPECIFIED',
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}
export enum LightingLevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

/**
 * ! Сценарии
 * 1. Изменение состояния через switchers, по значению "1" (в момент нажатия кнопки).
 *  1.2. Если в lightings есть хотя бы один включенный светильник, то при реакции на switchers, произойдет включение
 *   отключенных светильников, иначе все светильники выключатся.
 *  1.3. В зависимости от illuminations определяется значение LightingLevel.
 *   1.3.1. Можно указать какое значение брать, максимальное, минимальное хотя бы у одного, среднее между всеми.
 *   1.3.2. Можно указать, при каком LightingLevel включать все lightings.
 * 2. Если движение поднимается выше порога, происходит включение всех lightings в рамках макроса.
 *  2.1. Работает в заданном диапазоне времени, если не задано, то работает все время.
 * 3. Если движение и шум отсутствует в течении заданного времени, lightings выключаются.
 * 4. Если движение отсутствует, но шум присутствует в течении заданного времени все lightings выключаются.
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
      /**
       * Правило определения значения освещения
       * MAX - берем максимальное среди всех
       * MIN - берем минимальное среди всех
       * AVG - берем среднее среди всех
       */
      detection: LightingLevelDetection;
    };

    autoOn: {
      /**
       * Автоматическое включение по освещенности.
       * Если указано UNSPECIFIED, автоматическое включение по освещенности выключено.
       * Если указаны другие значения, то автоматическое включение всех lightings включено по выбранному уровню.
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
           * 0...24
           */
          form: number;

          /**
           * 0...24
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
       * 0...24
       * Если указать -1, то автоматическое отключение по таймеру отключается.
       */
      time: number;
    };
  };
};

/**
 * ! STATE
 */
export enum LightingForce {
  ON = 'ON',
  OFF = 'OFF',
  UNSPECIFIED = 'UNSPECIFIED',
}

type LightingMacrosPrivateState = {
  switch: 'ON' | 'OFF';
};

export type LightingMacrosPublicState = {
  force: LightingForce;
};

type LightingMacrosState = LightingMacrosPrivateState & LightingMacrosPublicState;

/**
 * ! OUTPUT
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

  constructor(parameters: LightingMacrosParameters) {
    super({
      ...parameters,
      type: MacrosType.LIGHTING,
      state: {
        force: parameters.state.force,
        switch: 'OFF',
      },
      controlTypes: {
        switchers: ControlType.SWITCH,
        illuminations: ControlType.ILLUMINATION,
        lightings: ControlType.SWITCH,
      },
    });

    this.nextOutput = {
      lightings: [],
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

  accept = ({ previous, current, devices, controls }: MacrosAccept): void => {
    super.accept({ previous, current, devices, controls });

    if (this.isDevicesReady() && this.isControlValueHasBeenChanged(current)) {
      this.execute();
    }
  };

  protected execute = () => {
    let stop = this.applyStateToOutput();

    if (stop) {
      return;
    }

    stop = this.applyInputToState();

    if (stop) {
      return;
    }

    this.applyOutputToState();
  };

  protected applyStateToOutput = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.force === 'ON') {
        nextSwitchState = 'ON';
        nextValue = '1';
      }

      if (this.state.force === 'OFF') {
        nextSwitchState = 'OFF';
        nextValue = '0';
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

  protected applyInputToState = () => {
    if (this.isSwitchHasBeenPress()) {
      logger('Button has been pressed ⬇️');
      logger(stringify({ name: this.name, currentState: this.state }));

      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.switch === 'ON') {
        /**
         * ! Если хотя бы один контрол из группы включен, то при первом клике, нужно включить все остальные, а
         * ! при втором клике все выключаем.
         */
        const everyOn = this.settings.lightings.every((lighting) => {
          return this.controls.get(getControlId(lighting))?.value === '1';
        });

        if (everyOn) {
          nextSwitchState = 'OFF';
          nextValue = '0';
        } else {
          nextSwitchState = 'ON';
          nextValue = '1';
        }
      } else if (this.state.switch === 'OFF') {
        nextSwitchState = 'ON';
        nextValue = '1';
      } else {
        logger('No handler found for the current state 🚨');
        logger(stringify({ name: this.name, currentState: this.state }));

        nextSwitchState = 'OFF';
        nextValue = '0';
      }

      this.state.switch = nextSwitchState;

      this.computeNextOutput(nextValue);
      this.applyNextOutput();

      return true;
    }

    return false;
  };

  protected applyOutputToState() {
    const isSomeOn = this.settings.lightings.some((lighting) => {
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
      lightings: this.settings.lightings.map((lighting) => {
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
  }

  protected computeNextOutput = (value: string) => {
    const nextOutput: LightingMacrosNextOutput = {
      lightings: [],
    };

    for (const { deviceId, controlId } of this.settings.lightings) {
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
  };

  protected applyNextOutput = () => {
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
  };

  /**
   * ! Реализации частных случаев.
   */
  protected isControlValueHasBeenChanged = (device: HyperionDevice): boolean => {
    return super.isControlValueHasBeenChanged(device, [...this.settings.switchers, ...this.settings.lightings]);
  };

  protected isSwitchHasBeenPress = (): boolean => {
    return super.isSwitchHasBeenPress(this.settings.switchers);
  };

  protected isSwitchHasBeenRelease = (): boolean => {
    return super.isSwitchHasBeenRelease(this.settings.switchers);
  };
}

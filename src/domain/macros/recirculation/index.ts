import { addMinutes, compareAsc, compareDesc, format, subMinutes } from 'date-fns';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';
import throttle from 'lodash.throttle';

import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:recirculation');

/**
 * ! SETTINGS
 */

/**
 * Состояние насоса
 */
export enum PumpState {
  UNSPECIFIED = 'UNSPECIFIED',
  ON = 'ON',
  OFF = 'OFF',
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
 * Рециркуляция ГВС.
 */
export type RecirculationMacrosSettings = {
  readonly devices: {
    /**
     * Насос.
     */
    readonly pump: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };

    /**
     * В случае реакции на переключатель (Кнопка, Открытие двери) запускается насос на delayMin.
     */
    readonly switcher: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    /**
     * В случае реакции на движение запускается насос на delayMin.
     */
    readonly motions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;

    /**
     * Устройства, для определения полной тишины.
     */
    readonly noises: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;

    /**
     * При возникновении протечки, насос отключается.
     */
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;
  };

  readonly properties: {
    /**
     * Время работы насоса после получения сигнала на включение.
     */
    readonly runMin: number;

    /**
     * Время в течении которого вода в трубах ещё не успела остыть,
     * это позволяет не включать насос пока вода не остынет.
     */
    readonly hotMin: number;

    /**
     * Порог реакции на движение.
     */
    readonly motion: {
      trigger: number;
      detection: LevelDetection;
    };

    /**
     * Порог реакции на шум.
     */
    readonly noise: {
      trigger: number;
      detection: LevelDetection;
    };

    /**
     * Спустя это время, при отсутствия движения, устанавливается полная тишина.
     */
    readonly silenceMin: number;

    readonly leak: {
      /**
       * Для ENUM это некий action который выбирается пользователь из предоставленного ENUM.
       */
      readonly enum: string;
    };
  };
};

/**
 * ! STATE
 */
export type RecirculationMacrosPublicState = object;

type RecirculationMacrosPrivateState = {
  pump: PumpState;
  leak: boolean;
  motion: number;
  noise: number;
};

type RecirculationMacrosState = RecirculationMacrosPublicState & RecirculationMacrosPrivateState;

/**
 * ! OUTPUT
 */
type RecirculationMacrosNextOutput = {
  pump?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  };
};

const VERSION = 0;

type RecirculationMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: RecirculationMacrosState = {
  pump: PumpState.UNSPECIFIED,
  leak: false,
  motion: -1,
  noise: -1,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class RecirculationMacros extends Macros<
  MacrosType.RECIRCULATION,
  RecirculationMacrosSettings,
  RecirculationMacrosState
> {
  private output: RecirculationMacrosNextOutput;

  private last = {
    motion: subMinutes(new Date(), 60),
    noise: subMinutes(new Date(), 60),
  };

  private block = {
    pumpRunOut: new Date(),
  };

  private pumpRunOutTime = subMinutes(new Date(), 60);

  private timer: {
    pumpRunOutTimer: NodeJS.Timeout;
  };

  constructor(parameters: RecirculationMacrosParameters) {
    const settings = RecirculationMacros.parseSettings(parameters.settings, parameters.version);
    const state = RecirculationMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.RECIRCULATION,

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
      pump: undefined,
    };

    this.timer = {
      pumpRunOutTimer: setInterval(this.pumpRunOutTimer, 60 * 1000),
    };
  }

  private getDebugContext = (mixin = {}) => {
    const timeFormat = 'yyyy.MM.dd HH:mm:ss OOOO';

    return {
      name: this.name,
      now: this.now,
      state: this.state,
      mixin,
      block: {
        pumpRunOut: format(this.block.pumpRunOut, timeFormat),
      },
      pumpRunOutTime: format(this.pumpRunOutTime, timeFormat),
      isPumpRunOut: this.isPumpRunOut,
      isMotion: this.isMotion,
      isSilence: this.isSilence,
      output: this.output,
    };
  };

  static parseSettings = (settings: string, version: number = VERSION): RecirculationMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): RecirculationMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): RecirculationMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    /**
     * TODO Передать схему, только для публичного стейта
     */
    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicState: string): void => {};

  /**
   * Автоматизация по времени.
   */
  private pumpRunOutTimer = () => {
    // logger.info('Checking the pump run-out time ⏱️');

    if (this.state.pump === PumpState.ON && !this.isPumpRunOut) {
      logger.info('The pump will be stopped because the pump run-out time has ended 🛑');

      this.state.pump = PumpState.OFF;

      logger.info('The pump start lock is installed 🌵');

      this.block.pumpRunOut = addMinutes(new Date(), this.settings.properties.hotMin);

      logger.debug(this.getDebugContext());

      this.computeOutput();
      this.send();
    }
  };

  protected collecting() {
    this.collectPump();
    this.collectLeaks();
    this.collectMotion();
    this.collectNoise();
  }

  private collectPump() {
    const { pump } = this.settings.devices;

    const control = this.controls.get(getControlId(pump));

    const nextPump = control?.value === control?.on ? PumpState.ON : PumpState.OFF;

    if (this.state.pump !== nextPump) {
      if (nextPump === PumpState.ON) {
        logger.info('The pump was found to be switched on 🔄 🧴');
      }

      if (nextPump === PumpState.OFF) {
        logger.info('The pump was found to be switched off 🛑');
      }

      logger.debug(this.getDebugContext({ nextPump }));

      this.state.pump = nextPump;
    }
  }

  private collectLeaks() {
    const { leaks } = this.settings.devices;

    const { leak } = this.settings.properties;

    const nextLeak = leaks.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === control.on || control.value === leak.enum;
      }

      return false;
    });

    if (this.state.leak !== nextLeak) {
      if (nextLeak) {
        logger.info('A leak has been detected 💧 🐬');
      } else {
        logger.info('The leak has been fixed 🌵 🍸');
      }

      logger.debug(this.getDebugContext({ nextLeak }));

      this.state.leak = nextLeak;
    }
  }

  private collectMotion = () => {
    const { motions } = this.settings.devices;
    const { motion } = this.settings.properties;

    this.state.motion = this.getValueByDetection(motions, motion.detection);

    if (this.state.motion >= motion.trigger) {
      this.last.motion = new Date();
    }
  };

  private collectNoise = () => {
    const { noises } = this.settings.devices;
    const { noise } = this.settings.properties;

    this.state.noise = this.getValueByDetection(noises, noise.detection);

    if (this.state.noise >= noise.trigger) {
      this.last.noise = new Date();
    }
  };

  private hasBlockByLeakLog = throttle(() => {
    logger.info('The pump is blocked by a leak 💧');
    logger.debug(this.getDebugContext());
  }, 10_000);

  private hasBlockPumpRunOutLockedLog = throttle(() => {
    logger.info('The pump run-out is blocked by hot 🥵 water in tubes 💧');
    logger.debug(this.getDebugContext());
  }, 10_000);

  private get hasBlock(): boolean {
    if (this.state.leak) {
      this.hasBlockByLeakLog();

      return true;
    }

    if (this.isPumpRunOutLocked) {
      this.hasBlockPumpRunOutLockedLog();

      return true;
    }

    return false;
  }

  private get isPumpRunOutLocked(): boolean {
    return compareAsc(this.block.pumpRunOut, new Date()) === 1;
  }

  private get isPumpRunOut(): boolean {
    return compareAsc(this.pumpRunOutTime, new Date()) === 1;
  }

  private get isMotion(): boolean {
    const { silenceMin } = this.settings.properties;

    return (
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      compareDesc(new Date(), addMinutes(new Date(this.last.motion.getTime()), silenceMin)) === 1
    );
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

  protected priorityComputation = () => {
    return false;
  };

  protected actionBasedComputing = (): boolean => {
    /**
     * TODO Добавить когда появятся двери.
     */

    return false;
  };

  protected sensorBasedComputing = (): boolean => {
    if (this.state.pump === PumpState.OFF && this.isMotion && !this.hasBlock) {
      logger.info('The pump will be turned ON because motion is detected 🔄');

      this.state.pump = PumpState.ON;

      logger.info('The pump run-out time is set ⏱️ 🎯');

      this.pumpRunOutTime = addMinutes(new Date(), this.settings.properties.runMin);

      logger.debug(this.getDebugContext());

      this.computeOutput();
      this.send();

      return false;
    }

    if (this.state.pump === PumpState.ON && this.state.leak) {
      logger.info('The pump will be turned OFF because leak is detected 🛑');

      this.state.pump = PumpState.OFF;

      this.pumpRunOutTime = subMinutes(new Date(), 60);

      logger.debug(this.getDebugContext());

      this.computeOutput();
      this.send();

      return false;
    }

    return false;
  };

  protected computeOutput = () => {
    this.output.pump = undefined;

    const device = this.settings.devices.pump;
    const controlType = ControlType.SWITCH;
    const control = this.controls.get(getControlId(device));

    if (!control || control.type !== controlType || !control.topic.write) {
      logger.error('The switch control specified in the settings was not found 🚨');
      logger.error({
        name: this.name,
        now: this.now,
        device,
        controlType,
        control,
        controls: this.controls.size,
      });

      return;
    }

    let value = control.off;

    if (this.state.pump === PumpState.ON) {
      value = control.on;
    }

    if (this.state.pump === PumpState.OFF) {
      value = control.off;
    }

    if (String(control.value) !== String(value)) {
      this.output.pump = { ...device, value };
    }

    logger.info('The next output was computed 🍋');
    logger.debug(this.getDebugContext());
  };

  protected send = () => {
    if (this.output.pump) {
      const device = this.output.pump;

      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.write;
      const message = device.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(this.getDebugContext({ device }));

        return;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });

      this.output.pump = undefined;
    }
  };

  protected destroy() {
    clearInterval(this.timer.pumpRunOutTimer);
  }
}

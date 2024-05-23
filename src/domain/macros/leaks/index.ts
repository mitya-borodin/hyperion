/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import defaultsDeep from 'lodash.defaultsdeep';

import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:leaks');

/**
 * ! SETTINGS
 */

/**
 * Текущее положение крана
 */
export enum ValueState {
  UNSPECIFIED = 'UNSPECIFIED',
  OPEN = 'OPEN',
  ON_WAY = 'ON_WAY',
  CLOSE = 'CLOSE',
}

/**
 * Защита от протечек.
 *
 * Позволяет защищать от протечек воды и газа.
 *
 * Макрос отвечает только за изменение положение крана,
 * и никак не заботится последствиями перекрытия крана.
 *
 * Макросы управляющие газовым или водяным оборудование
 * должны отслеживать положение требуемых для их работы кранов,
 * и если краны переходят в состояние ЗАКРЫТО, то прекращать
 * работу оборудования.
 */
export type LeaksMacrosSettings = {
  readonly devices: {
    /**
     * Датчики протечки
     *
     * Датчики протечки могут быть проводные реализованные как SWITCH и
     * без проводными возвращающие некий action из предоставленного ENUM значений.
     */
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH | ControlType.ENUM;
    }>;

    /**
     * Список кранов с управлением на уровне приложения,
     * реализует логику переключателя.
     */
    readonly switch: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    /**
     * Список кранов с управлением на уровне приложения,
     * реализует логику перехода по состояниям перечисленным в enum
     * на всех кранах должно быть установлено одно закрытое положение.
     */
    readonly enum: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ENUM;
    }>;

    /**
     * Краны с управлением на аналоговом уровне,
     * на всех кранах должно быть установлено одно закрытое положение.
     */
    readonly analog: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.RANGE;
    }>;

    /**
     * Краны с релейным управлением,
     * на всех кранах должно быть установлено одно закрытое положение.
     *
     * ON/OFF - "обычное" реле, которое может подключать фаз к одному выходу.
     *
     * NC/NO - "специальное" реле, которое может подключать фазу между двумя
     * разными выходами, подключенных к контактам NC/NO.
     *
     * NC - normal close, нормально закрытый контакт, это означает,
     * что когда нет питания, контакт находится в замкнутом положении.
     *
     * NO - normal open, нормально открытый контакт, это означает,
     * что когда нет питания, контакт находится в разомкнутом положении.
     *
     * Для специальных модулей реле WBIO-DO-R10R-4, имеется возможность ВКЛ/ВЫКЛ и переключать фазу между NC/NO.
     * Позволяет отключить фазу, переключить направление и подать фазу, чтобы исключить случай включения двух фаз сразу.
     * Хотя если реле NC/NO то там и не получится подать одновременно фазу на левую и правую сторону.
     */
    readonly phase: Array<{
      /**
       * open - реле отвечающее за открывание крана, может быть как обычное ON/OFF так и NC/NO.
       */
      readonly open: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * close - реле отвечающее за закрытие крана,
       * присутствует когда выбрано два ON/OFF реле,
       * отсутствует если используется специальная конфигурация WBIO-DO-R10R-4.
       */
      readonly close?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * power - реле отвечающее за подачу питания на выбранную фазу,
       * присутствует только в случае использования специальной конфигурации WBIO-DO-R10R-4.
       */
      readonly power?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * Присутствует в том случае, если у крана есть контакты позволяющие определить открытое состояние.
       */
      readonly isOpen?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * Присутствует в том случае, если у крана есть контакты позволяющие определить закрытое состояние.
       */
      readonly isClose?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };
    }>;
  };

  readonly properties: {
    leak: {
      /**
       * Для SWITCH это логическая единица и логический ноль, где единица это наличие протечки.
       */
      switch: string;

      /**
       * Для ENUM это некий action который выбирается пользователь из предоставленного ENUM.
       */
      enum: string;
    };

    enum: {
      open: string;
      close: string;
    };

    analog: {
      open: string;
      close: string;
    };

    phase: {
      durationSec: number;
    };
  };
};

/**
 * ! STATE
 */
export type LeaksMacrosPublicState = {
  /**
   * Жесткое закрытие/открытие крана, закрывает или открывает, и прерывает вычисление дальнейших стадий.
   */
  force: 'UNSPECIFIED' | 'OPEN' | 'CLOSE';

  /**
   * Состояние ожидание подтверждения на открытие крана, в случае отмены возвращается в UNSPECIFIED
   * и при следующей попытке открыть, создается запрос.
   */
  approve: 'UNSPECIFIED' | 'WAIT' | 'APPROVED' | 'CANCELED';
};

type LeaksMacrosPrivateState = {
  leak: boolean;
  valve: ValueState;
};

type LeaksMacrosState = LeaksMacrosPublicState & LeaksMacrosPrivateState;

/**
 * ! OUTPUT
 */
type LeaksMacrosNextOutput = {
  readonly analog: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly enum: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly switch: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly phase: Array<{
    readonly open: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };
    readonly close?: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };
    readonly power?: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };
  }>;
};

const VERSION = 0;

type LeaksMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: LeaksMacrosState = {
  force: 'UNSPECIFIED',
  leak: false,
  approve: 'UNSPECIFIED',
  valve: ValueState.UNSPECIFIED,
};

export class LeaksMacros extends Macros<MacrosType.LEAKS, LeaksMacrosSettings, LeaksMacrosState> {
  private output: LeaksMacrosNextOutput;

  constructor(parameters: LeaksMacrosParameters) {
    const settings = LeaksMacros.parseSettings(parameters.settings, parameters.version);
    const state = LeaksMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.LEAKS,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, defaultState),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.output = {
      analog: [],
      enum: [],
      switch: [],
      phase: [],
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): LeaksMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): LeaksMacrosState => {
    if (!state) {
      return defaultState;
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): LeaksMacrosPublicState => {
    if (!state) {
      return defaultState;
    }

    /**
     * TODO Передать схему, только для публичного стейта
     */
    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicStateJson: string): void => {
    const nextPublicState = LeaksMacros.parsePublicState(nextPublicStateJson, this.version);

    logger.info('The next public state was appeared ⏭️');

    if (this.state.force !== nextPublicState.force) {
      if (nextPublicState.force === 'UNSPECIFIED') {
        logger.info('Forced behavior is disabled 🆓');
      }

      if (nextPublicState.force === 'OPEN') {
        logger.info('Forced behavior is open 💧');
      }

      if (nextPublicState.force === 'CLOSE') {
        logger.info('Forced behavior is close 🌵');
      }

      logger.debug({
        name: this.name,
        now: this.now,
        nextPublicState,
        state: this.state,
      });

      this.state.force = nextPublicState.force;

      this.execute();
    }
  };

  protected collecting() {
    this.collectLeaks();
  }

  private collectLeaks() {
    const { leaks } = this.settings.devices;

    const { leak } = this.settings.properties;

    const nextLeak = leaks.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === leak.switch || control.value === leak.enum;
      }

      return false;
    });

    if (this.state.leak !== nextLeak) {
      if (nextLeak) {
        logger.info('A leak has been detected 💧 🐬');
      } else {
        logger.info('The leak has been fixed 🌵 🍸');
      }

      logger.debug({
        name: this.name,
        now: this.now,
        nextLeak,
        state: this.state,
      });

      this.state.leak = nextLeak;
    }
  }

  private get isSwitchOpen(): boolean {
    return this.settings.devices.switch.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === control.on;
      }

      return false;
    });
  }

  private get isSwitchClose(): boolean {
    return this.settings.devices.switch.every((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === control.off;
      }

      return false;
    });
  }

  private get isEnumOpen(): boolean {
    return this.settings.devices.enum.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.enum.open;
      }

      return false;
    });
  }

  private get isEnumClose(): boolean {
    return this.settings.devices.enum.every((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.enum.close;
      }

      return false;
    });
  }

  /**
   * Задается на уровне FE приложения.
   */
  protected priorityComputation = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      if (this.state.force === 'OPEN' && this.state.valve === ValueState.CLOSE) {
        logger.info('The valves will be forcibly closed 🌵');

        this.state.valve = ValueState.CLOSE;

        logger.debug({
          name: this.name,
          now: this.now,
          state: this.state,
        });

        this.computeOutput();
        this.send();
      }

      if (this.state.force === 'CLOSE' && this.state.valve === ValueState.OPEN) {
        logger.info('The valves will be forcibly open 💧');

        this.state.valve = ValueState.OPEN;

        logger.debug({
          name: this.name,
          now: this.now,
          state: this.state,
        });

        this.computeOutput();
        this.send();
      }

      return true;
    }

    return false;
  };

  /**
   * У нас нет непосредственных элементов управления.
   */
  protected actionBasedComputing = (): boolean => {
    return false;
  };

  protected sensorBasedComputing = (): boolean => {
    let nextValueState = this.state.valve;

    if (this.state.leak && this.state.valve === ValueState.OPEN) {
      logger.info('The valves will be closed 🏜️ 🌵');

      nextValueState = ValueState.CLOSE;
    }

    if (!this.state.leak && this.state.valve === ValueState.CLOSE) {
      logger.info('The valves will be opened 🌊 💧');

      nextValueState = ValueState.OPEN;
    }

    if (this.state.valve !== nextValueState) {
      logger.info('The condition of the valve has been changed 🎲 🎯 💾');

      this.state.valve = nextValueState;

      logger.debug({
        name: this.name,
        now: this.now,
        state: this.state,
      });

      this.computeOutput();
      this.send();
    }

    return false;
  };

  protected computeOutput = () => {
    this.output = {
      switch: [],
      enum: [],
      analog: [],
      phase: [],
    };

    for (const device of this.settings.devices.switch) {
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

        continue;
      }

      let value = control.off;

      if (this.state.valve === ValueState.OPEN) {
        value = control.on;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = control.off;
      }

      if (String(control.value) !== String(value)) {
        this.output.switch.push({ ...device, value });
      }
    }

    for (const device of this.settings.devices.enum) {
      const controlType = ControlType.SWITCH;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The enum control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          device,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      let value = this.settings.properties.enum.close;

      if (this.state.valve === ValueState.OPEN) {
        value = this.settings.properties.enum.open;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = this.settings.properties.enum.close;
      }

      if (String(control.value) !== String(value)) {
        this.output.enum.push({ ...device, value });
      }
    }

    for (const device of this.settings.devices.analog) {
      const controlType = ControlType.RANGE;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The range control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          device,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      let value = this.settings.properties.analog.close;

      if (this.state.valve === ValueState.OPEN) {
        value = this.settings.properties.analog.open;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = this.settings.properties.analog.close;
      }

      if (String(control.value) !== String(value)) {
        this.output.analog.push({ ...device, value });
      }
    }

    // for (const device of this.settings.devices.phase) {
    //   const controlType = ControlType.SWITCH;
    //   const control = this.controls.get(getControlId(device));

    //   if (!control || control.type !== controlType || !control.topic.write) {
    //     logger.error('The analog control specified in the settings was not found 🚨');
    //     logger.error({
    //       name: this.name,
    //       now: this.now,
    //       device,
    //       controlType,
    //       control,
    //       controls: this.controls.size,
    //     });

    //     continue;
    //   }

    //   let value = this.settings.properties.analog.close;

    //   if (this.state.valve === ValueState.OPEN) {
    //     value = this.settings.properties.analog.open;
    //   }

    //   if (this.state.valve === ValueState.CLOSE) {
    //     value = this.settings.properties.analog.close;
    //   }

    //   if (String(control.value) !== String(value)) {
    //     this.output.analog.push({ ...device, value });
    //   }
    // }

    logger.info('The output was computed 🍋 🧪 ✊🏻');
    logger.debug({
      name: this.name,
      now: this.now,
      state: this.state,
      output: this.output,
    });
  };

  protected send = () => {};

  protected destroy() {}
}

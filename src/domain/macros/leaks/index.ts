/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import { format } from 'date-fns';
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:leaks');

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
     * Краны с управлением на аналоговом уровне,
     * на всех кранах должно быть установлено одно закрытое положение.
     */
    readonly analog: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.RANGE;
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
     * Список кранов с управлением на уровне приложения,
     * реализует логику переключателя.
     */
    readonly switch: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
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

    analog: {
      open: string;
      close: string;
    };

    enum: {
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
export type LeaksMacrosPublicState = {};

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

export class LeaksMacros extends Macros<MacrosType.LEAKS, LeaksMacrosSettings, LeaksMacrosState> {
  private nextOutput: LeaksMacrosNextOutput;

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

      state: defaultsDeep(state, {
        leak: false,
        valve: ValueState.UNSPECIFIED,
      }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
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
      return {
        leak: false,
        valve: ValueState.UNSPECIFIED,
      };
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicStateJson: string): void => {
    const nextPublicState = LeaksMacros.parseState(nextPublicStateJson, this.version);

    logger('The next state was appeared ⏭️ ⏭️ ⏭️');
    logger({
      name: this.name,
      now: this.now,
      nextPublicState,
      state: this.state,
    });
  };

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
    const nextOutput: LeaksMacrosNextOutput = {
      analog: [],
      enum: [],
      switch: [],
      phase: [],
    };

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

  protected send = () => {};

  protected destroy() {}

  /**
   * ! INTERNAL_IMPLEMENTATION
   */
}

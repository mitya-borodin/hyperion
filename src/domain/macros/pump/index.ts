/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:pump');

/**
 * Насос холодного водоснабжения, с защитой от протечек.
 *
 * Позволяет управлять контактором для отключения питание насоса
 * (либо самого насоса, либо частотного преобразователя) в случае протечки.
 *
 * На контактор так же вешается питание фильтров (кабинет, колонны), чтобы
 * они не считали время до следующей регенерации.
 *
 * Рекомендуется использовать НО (нормально открытый) контактор,
 * чтобы при пропадании питания контактор переключилось в открытое
 * положение и выключил насос.
 */

/**
 * ! SETTINGS
 */

export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

export type PumpMacrosSettings = {
  readonly deviceId: string;
  readonly controlId: string;
  readonly controlType: ControlType.SWITCH;

  /**
   * Датчики протечки.
   *
   * Связь конкретного насоса с группой датчиков протечки, если хотя бы один срабатывает, то насос выключается.
   */
  readonly leaks: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  }>;
};

/**
 * ! STATE
 */

/**
 * Состояние макроса которое может изменить пользователь
 */
export type PumpMacrosPublicState = {};

/**
 * Внутреннее состояние макроса, которое не может изменить пользователь.
 * Оно нужно для реализации внутреннего устройства макроса.
 */
export type PumpMacrosPrivateState = {
  pump: DeviceState;
  leak: boolean;
};

type PumpMacrosState = PumpMacrosPublicState & PumpMacrosPrivateState;

const defaultState: PumpMacrosState = {
  leak: false,
  pump: DeviceState.OFF,
};

const createDefaultState = () => cloneDeep(defaultState);

/**
 * ! OUTPUT
 */
type PumpMacrosNextOutput = {
  pump?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  };
};

/**
 * Версия макроса, к версии привязана схеме настроек, состояния и их валидация при запуске,
 *  так же к схеме привязаны миграции схем при запуске.
 */
const VERSION = 0;

/**
 * ! CONSTRUCTOR PARAMS
 */
type PumpMacrosParameters = MacrosParameters<string, string | undefined>;

export class PumpMacros extends Macros<MacrosType.PUMP, PumpMacrosSettings, PumpMacrosState> {
  private nextOutput: PumpMacrosNextOutput;

  constructor(parameters: PumpMacrosParameters) {
    const settings = PumpMacros.parseSettings(parameters.settings, parameters.version);
    const state = PumpMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      macrosRepository: parameters.macrosRepository,
      eventBus: parameters.eventBus,

      type: MacrosType.PUMP,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, createDefaultState()),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      pump: undefined,
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): PumpMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): PumpMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): PumpMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicState: string): void => {};

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
    const nextOutput: PumpMacrosNextOutput = {
      pump: undefined,
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

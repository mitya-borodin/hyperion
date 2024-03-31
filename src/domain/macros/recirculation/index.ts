/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:recirculation');

/**
 * ! SETTINGS
 */
export enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Рециркуляция ГВС.
 */
export type RecirculationMacrosSettings = {
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
    readonly trigger: Trigger;
    readonly delayMin: number;
  }>;

  /**
   * В случае реакции на движение запускается насос на delayMin.
   */
  readonly motion: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
    readonly trigger: number;
    readonly delayMin: number;
  }>;

  /**
   * В случае реакции на шум запускается насос на delayMin.
   */
  readonly noise: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
    readonly trigger: number;
    readonly delayMin: number;
  }>;

  /**
   * При возникновении протечки, насос отключается.
   */
  readonly leaks: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  }>;

  /**
   * Расписание включения рециркуляции.
   *
   * Если список пустой, то рециркуляция включается по датчикам.
   *
   * Если указаны диапазоны времени, то если хотя бы в один диапазон попадает
   * текущее время в которое требуется включить насос, насос включается вне зависимости от датчиков.
   *
   * Требуется указание часов в сутках от 0 до 23.
   */
  readonly schedule: Array<{
    from: string;
    to: string;
  }>;
};

/**
 * ! STATE
 */
export type RecirculationMacrosPublicState = {};

type RecirculationMacrosPrivateState = {
  pump: DeviceState;
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

export class RecirculationMacros extends Macros<
  MacrosType.RECIRCULATION,
  RecirculationMacrosSettings,
  RecirculationMacrosState
> {
  private nextOutput: RecirculationMacrosNextOutput;

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

      state: defaultsDeep(state, {
        disable: {
          coldWater: false,
          hotWater: false,
          recirculation: false,
        },
        hotWaterTemperature: 60,
        coldWaterPumps: {},
        valves: {},
        boilerPumps: {},
        heatRequests: {},
        recirculationPumps: {},
      }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      pump: undefined,
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): RecirculationMacrosSettings => {
    // if (version === VERSION) {
    //   logger('Settings in the current version ✅');
    //   logger(stringify({ from: version, to: VERSION }));

    // /**
    //  * TODO Проверять через JSON Schema
    //  */

    //   return JSON.parse(settings);
    // }

    // logger('Migrate settings was started 🚀');
    // logger(stringify({ from: version, to: VERSION }));

    // const mappers = [() => {}].slice(version, VERSION + 1);

    // logger(mappers);

    // const result = mappers.reduce((accumulator, mapper) => mapper(accumulator), JSON.parse(settings));

    // logger(stringify(result));
    // logger('Migrate settings was finished ✅');

    return JSON.parse(settings);
  };

  static parseState = (state?: string): RecirculationMacrosState => {
    if (!state) {
      return {
        pump: DeviceState.OFF,
      };
    }

    /**
     * TODO Проверять через JSON Schema
     */

    return JSON.parse(state);
  };

  setState = (nextPublicState: string): void => {};

  protected applyPublicState = () => {
    return false;
  };

  protected applyInput = () => {
    return false;
  };

  protected applyExternalValue() {}

  protected computeOutput = (value: string) => {
    const nextOutput: RecirculationMacrosNextOutput = {
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

  protected applyOutput = () => {};

  protected destroy() {}

  /**
   * ! INTERNAL_IMPLEMENTATION
   */
}

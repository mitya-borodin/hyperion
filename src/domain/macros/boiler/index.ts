/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:boiler');

/**
 * ! SETTINGS
 */
export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Параллельная загрузка бойлера.
 */
export type BoilerMacrosSettings = {
  /**
   * Датчик температуры.
   */
  readonly temperature: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.TEMPERATURE;
  };

  /**
   * Насос загрузки.
   */
  readonly pump: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  };

  /**
   * Уникальный идентификатор источника тепла.
   *
   * Устройства с подходящим контролом виртуальное и появляется запущен макрос источник тепла.
   */
  readonly heat: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.HEAT_SOURCE;
  }>;
};

/**
 * ! STATE
 */
export type BoilerMacrosPublicState = {
  /**
   * Уставка, до какой температуры греть горячую воду.
   *
   * Если уставка меньше 60, то раз в 6 часов, вода будет нагрета до 60.
   * Если уставка больше 75 градусов то вода будет нагреваться до 75 градусов.
   *
   * Диапазон значений 40 - 75 градусов.
   */
  temperatureTarget: number;
};

type BoilerMacrosPrivateState = {
  /**
   * Текущая температура.
   */
  temperature: number;

  /**
   * Состояние работы насоса.
   */
  pump: DeviceState;
};

type BoilerMacrosState = BoilerMacrosPublicState & BoilerMacrosPrivateState;

/**
 * ! OUTPUT
 */
type BoilerMacrosNextOutput = {
  pump?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  };
  heat: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.HEAT_SOURCE;
    readonly value: number;
  }>;
};

const VERSION = 0;

type BoilerMacrosParameters = MacrosParameters<string, string | undefined>;

export class BoilerMacros extends Macros<MacrosType.BOILER, BoilerMacrosSettings, BoilerMacrosState> {
  private nextOutput: BoilerMacrosNextOutput;

  constructor(parameters: BoilerMacrosParameters) {
    const settings = BoilerMacros.parseSettings(parameters.settings, parameters.version);
    const state = BoilerMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.BOILER,

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
      heat: [],
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): BoilerMacrosSettings => {
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

  static parseState = (state?: string): BoilerMacrosState => {
    if (!state) {
      return {
        temperatureTarget: 60,
        temperature: 60,
        pump: DeviceState.OFF,
      };
    }

    /**
     * TODO Проверять через JSON Schema
     */

    return JSON.parse(state);
  };

  setState = (nextPublicState: string): void => {};

  protected priorityComputation = () => {
    return false;
  };

  protected computation = () => {};

  protected collecting() {}

  protected output = (value: string) => {
    const nextOutput: BoilerMacrosNextOutput = {
      pump: undefined,
      heat: [],
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

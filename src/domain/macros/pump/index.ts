/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:pump');

/**
 * ! SETTINGS
 */
export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Насос холодного водоснабжения, с защитой от протечек.
 *
 * Позволяет управлять контактором для отключения питание насоса
 * (либо самого насоса, либо частотного преобразователя) в случае протечки.
 *
 * Рекомендуется использовать НО (нормально открытый) контактор,
 * чтобы при пропадании питания контактор переключилось в открытое
 * положение и выключил насос.
 */
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
export type PumpMacrosPublicState = {};

type PumpMacrosPrivateState = {
  pump: DeviceState;
  leak: boolean;
};

type PumpMacrosState = PumpMacrosPublicState & PumpMacrosPrivateState;

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

const VERSION = 0;

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

      eventBus: parameters.eventBus,

      type: MacrosType.PUMP,

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

  static parseSettings = (settings: string, version: number = VERSION): PumpMacrosSettings => {
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

  static parseState = (state?: string): PumpMacrosState => {
    if (!state) {
      return {
        pump: DeviceState.OFF,
        leak: false,
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

  protected computation = () => {
    return false;
  };

  protected collecting() {}

  protected output = (value: string) => {
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

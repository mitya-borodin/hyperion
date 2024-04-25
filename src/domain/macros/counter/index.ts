/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:counter');

/**
 * ! SETTINGS
 */
export enum CounterType {
  COLD_WATER = 'COLD_WATER',
  HOT_WATER = 'HOT_WATER',
  GAS = 'GAS',
  ELECTRICITY = 'ELECTRICITY',
  HEAT = 'HEAT',
  SWITCH = 'SWITCH',
  RELAY_ON = 'RELAY_ON',
}

export enum CounterTrigger {
  FRONT = 'FRONT',
  BACK = 'BACK',
  BOTH = 'BOTH',
}

/**
 * Счетчики воды, газа, электричества, тепла, количества (верхних, нижних) уровней на переключателях,
 *  время работы, простоя реле.
 */
export type CounterMacrosSettings = {
  readonly deviceId: string;
  readonly controlId: string;
  readonly controlType: ControlType.SWITCH;

  readonly type: CounterType;
  readonly trigger: CounterTrigger;
};

/**
 * ! STATE
 */
export type CounterMacrosPublicState = {
  value: number;
};

type CounterMacrosPrivateState = {};

type CounterMacrosState = CounterMacrosPublicState & CounterMacrosPrivateState;

/**
 * ! OUTPUT
 */
type CounterMacrosNextOutput = {
  readonly value: number;
  readonly unitOfMeasurement: string;
};

const VERSION = 0;

type CounterMacrosParameters = MacrosParameters<string, string | undefined>;

export class CounterMacros extends Macros<MacrosType.COUNTER, CounterMacrosSettings, CounterMacrosState> {
  private nextOutput: CounterMacrosNextOutput;

  constructor(parameters: CounterMacrosParameters) {
    const settings = CounterMacros.parseSettings(parameters.settings, parameters.version);
    const state = CounterMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.COUNTER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, { value: 0 }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      value: 0,
      unitOfMeasurement: '',
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): CounterMacrosSettings => {
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

  static parseState = (state?: string): CounterMacrosState => {
    if (!state) {
      return {
        value: 0,
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

  protected computeOutput = (value: string) => {
    const nextOutput: CounterMacrosNextOutput = {
      value: 0,
      unitOfMeasurement: '',
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

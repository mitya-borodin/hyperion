/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
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
export enum ValueState {
  OPEN = 'OPEN',
  ON_WAY = 'ON_WAY',
  CLOSE = 'CLOSE',
}

export enum ValveType {
  PHASE = 'PHASE',
  ANALOG = 'ANALOG',
  ZIGBEE = 'ZIGBEE',
}

/**
 * Защита от протечек.
 *
 * Кран может быть установлен на вводе воды в дом, на конкретных линиях, на холодной и горячей воде.
 */
export type LeaksMacrosSettings = {
  /**
   * Тип управления краном, бывают краны, без контроля положения,
   *  с контролем крайних положений, аналоговое управление 0-10В, кран подключенный по zigbee2mqtt.
   */
  readonly type: ValveType;

  /**
   * В случае если кран с аналоговым управлением, задается порт выдающий 0-10 вольт,
   * на самом кране выставляется, 0 открыто, 10 закрыто.
   */
  readonly analog?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.RANGE;
  };

  /**
   * В случае если кран с фазным управлением, элементов массива может быть 2-3, для двух позиционных кранов.
   *
   * Если элементов 2, то первый это OPEN, второй CLOSE.
   * Если элементов 3, то первый это OPEN, второй CLOSE, третий ON/OFF.
   */
  readonly phase?:
    | [
        {
          readonly deviceId: string;
          readonly controlId: string;
          readonly controlType: ControlType.SWITCH;
        },
        {
          readonly deviceId: string;
          readonly controlId: string;
          readonly controlType: ControlType.SWITCH;
        },
      ]
    | [
        {
          readonly deviceId: string;
          readonly controlId: string;
          readonly controlType: ControlType.SWITCH;
        },
        {
          readonly deviceId: string;
          readonly controlId: string;
          readonly controlType: ControlType.SWITCH;
        },
        {
          readonly deviceId: string;
          readonly controlId: string;
          readonly controlType: ControlType.SWITCH;
        },
      ];

  /**
   * Сигналы положения кранов.
   *
   * Если type: 'PHASE' то должно быть определено две позиции [OPEN, CLOSE],
   * в списке позиций первая всегда OPEN вторая всегда CLOSE, для двух позиционных кранов.
   */
  readonly positions?: [
    {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    },
    {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    },
  ];

  /**
   * Датчики протечки.
   *
   * Связь конкретного крана с группой датчиков протечки, если хотя бы один срабатывает, то кран закрывается,
   * и как только пропадает протечка, кран открывается.
   *
   * TODO Сделать в следующей итерации функцию, разблокировки воды через апрув пользователя.
   *
   * Так как может возникнуть такая ситуация, протекло, высохло протекло, высохло и так по кругу.
   */
  readonly leaks: Array<{
    readonly deviceId: string;
    readonly controlId: string;
  }>;
};

/**
 * ! STATE
 */
export type LeaksMacrosPublicState = {};

type LeaksMacrosPrivateState = {
  valve: ValueState;
  leak: boolean;
};

type LeaksMacrosState = LeaksMacrosPublicState & LeaksMacrosPrivateState;

/**
 * ! OUTPUT
 */
type LeaksMacrosNextOutput = {
  /**
   * Управление аналоговым краном, 0 открыто, 10 закрыто.
   */
  readonly analog?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  };

  /**
   * Состояние реле, для фазного управления, двух позиционным краном.
   *
   * 0 - Направление к положению открыто
   * 1 - Направление к положению закрыто
   * 2 - Подача питания
   */
  readonly phase?: [
    {
      readonly deviceId: string;
      readonly controlId: string;
      readonly value: string;
    },
    {
      readonly deviceId: string;
      readonly controlId: string;
      readonly value: string;
    },
    {
      readonly deviceId: string;
      readonly controlId: string;
      readonly value: string;
    },
  ];
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
      analog: undefined,
      phase: undefined,
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): LeaksMacrosSettings => {
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

  static parseState = (state?: string): LeaksMacrosState => {
    if (!state) {
      return {
        valve: ValueState.ON_WAY,
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

  protected computation = () => {};

  protected collecting() {}

  protected computeOutput = (value: string) => {
    const nextOutput: LeaksMacrosNextOutput = {
      analog: undefined,
      phase: undefined,
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

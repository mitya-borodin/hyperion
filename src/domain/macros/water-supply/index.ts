/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion-water-supply-macros');

/**
 * ! SETTINGS
 */
export enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum ValueState {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
}

export enum ValveType {
  PHASE = 'PHASE',
  ANALOG = 'ANALOG',
}

export enum WaterMeterTrigger {
  FRONT = 'FRONT',
  BACK = 'BACK',
  BOTH = 'BOTH',
}

export enum DeviceState {
  ON = 'ON',
  OFF = 'OFF',
}

export type WaterSupplyMacrosSettings = {
  readonly name: string;
  readonly description: string;

  /**
   * Счетчики холодной воды.
   */
  readonly coldWaterMeters: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
    readonly trigger: WaterMeterTrigger;
    readonly value: number;
    readonly description: string;
  }>;

  /**
   * Счетчики горячей воды.
   *
   * Допустимо использовать нескольких счетчиков.
   */
  readonly hotWaterMeters: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
    readonly trigger: WaterMeterTrigger;
    readonly value: number;
    readonly description: string;
  }>;

  /**
   * Насосы холодного водоснабжения.
   *
   * Позволяет управлять контактором для отключения питание насоса
   * (либо самого насоса, либо частотного преобразователя) в случае протечки.
   *
   * Рекомендуется использовать НО (нормально открытый) контактор,
   * чтобы при пропадании питания контактор переключилось в открытое
   * положение и выключил насос.
   */
  readonly coldWaterPumps: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;

    readonly description: string;

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
  }>;

  /**
   * Краны защиты от протечки.
   *
   * Кран может быть установлен на вводе воды в дом, на конкретных линиях, на холодной и горячей воде.
   */
  readonly valves: Array<{
    readonly description: string;
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
     * В случае если кран с фазным управлением, элементов массива может быть 2-3.
     *
     * Если элементов 2, то первый это OPEN, второй CLOSE
     * Если элементов 3, то первый это OPEN, второй CLOSE, третий ON/OFF
     */
    readonly phase?: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    /**
     * Сигналы положения кранов.
     *
     * Если type: 'PHASE' то должно быть определено две позиции [OPEN, CLOSE],
     * в списке позиций первая всегда OPEN вторая всегда CLOSE.
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
     * TODO Сделать в следующей итерации функцию, открывания через апрув пользователя.
     *
     * Так как может возникнуть такая ситуация, протекло, высохло протекло, высохло и так по кругу.
     */
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
  }>;

  readonly boilers: Array<{
    readonly description: string;
    /**
     * Датчик температуры бойлера.
     *
     * Установлен в специальную гильзу в бойлере.
     */
    readonly temperatureSensor: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.TEMPERATURE;
    };

    /**
     * Насос загрузки бойлера.
     *
     * Реализация функции параллельной загрузки бойлера.
     */
    readonly pump: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };

    /**
     * Уникальный идентификатор источника тепла, в
     * котором нужно будет запросить тепло для загрузки бойлера.
     *
     * ? Список идентификаторов тепла будет доступе в макросе отопление.
     */
    readonly heat: string[];
  }>;

  /**
   * Рециркуляция ГВС.
   */
  readonly recirculation: Array<{
    readonly description: string;

    /**
     * Насос рециркуляции ГВС.
     */
    readonly pump: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    };

    /**
     * В случае реакции на переключатель запускается насос на delayMin
     */
    readonly switcher: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
      readonly trigger: Trigger;
      readonly delayMin: number;
    }>;

    /**
     * В случае реакции на движение запускается насос на delayMin
     */
    readonly motion: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
      readonly trigger: number;
      readonly delayMin: number;
    }>;

    /**
     * В случае реакции на шум запускается насос на delayMin
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
     * Если список пустой, то рециркуляция может быть включена в любое время.
     *
     * Если указаны диапазоны времени, то если хотя бы в один диапазон попадает
     * текущее время в которое требуется включить насос, насос включается.
     *
     * Требуется указание даты в формате ISO '2024-03-16T07:31:20.331Z'.
     */
    readonly schedule: Array<{
      from: string;
      to: string;
    }>;
  }>;
};

/**
 * ! STATE
 */
export type WaterSupplyMacrosPublicState = {
  disable: {
    /**
     * В случае выключения холодной воды, горячая вода и рециркуляция тоже выключатся.
     */
    coldWater: boolean;
    /**
     * В случае выключения горячей воды, рециркуляция тоже выключатся.
     */
    hotWater: boolean;
    /**
     * В случае выключения рециркуляции, выключится только рециркуляция.
     */
    recirculation: boolean;
  };

  /**
   * Уставка, до какой температуры греть горячую воду.
   *
   * Если уставка меньше 60, то раз в 6 часов, вода будет нагрета до 60.
   * Если уставка больше 75 градусов то вода будет нагреваться до 75 градусов.
   *
   * Диапазон значений 40 - 75 градусов.
   */
  hotWaterTemperature: number;
};

type WaterSupplyMacrosPrivateState = {
  coldWaterPumps: { [key: string]: DeviceState };
  valves: { [key: string]: ValueState };
  boilerPumps: { [key: string]: DeviceState };
  heatRequests: { [key: string]: number };
  recirculationPumps: { [key: string]: DeviceState };
};

type WaterSupplyMacrosState = WaterSupplyMacrosPublicState & WaterSupplyMacrosPrivateState;

/**
 * ! OUTPUT
 */
type WaterSupplyMacrosNextOutput = {
  coldWaterPumps: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  valves: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ValveType;

    /**
     * Значение напряжения 0-10 Вольт, для кранов с аналоговым управлением.
     */
    readonly value: string;

    /**
     * Список новых состояний реле, для случая фазного управления краном.
     */
    readonly relays: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly value: string;
    }>;
  }>;
  boilerPumps: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  recirculationPumps: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

const VERSION = 0;

type WaterSupplyMacrosParameters = MacrosParameters<string, string | undefined>;

export class WaterSupplyMacros extends Macros<
  MacrosType.WATER_SUPPLY,
  WaterSupplyMacrosSettings,
  WaterSupplyMacrosState
> {
  private nextOutput: WaterSupplyMacrosNextOutput;

  constructor(parameters: WaterSupplyMacrosParameters) {
    const settings = WaterSupplyMacros.parseSettings(parameters.settings, parameters.version);
    const state = WaterSupplyMacros.parseState(parameters.state);

    super({
      eventBus: parameters.eventBus,

      type: MacrosType.WATER_SUPPLY,

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

      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      controlTypes: {
        leaks: ControlType.SWITCH,
        coldWaterCounter: ControlType.SWITCH,
        hotWaterCounter: ControlType.SWITCH,
        pump: ControlType.SWITCH,
        valve: ControlType.SWITCH,
        recycling: ControlType.SWITCH,
        hotWaterTemperature: ControlType.TEMPERATURE,
        boilerPump: ControlType.SWITCH,
      },

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      coldWaterPumps: [],
      valves: [],
      boilerPumps: [],
      recirculationPumps: [],
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): WaterSupplyMacrosSettings => {
    // if (version === VERSION) {
    //   logger('Settings in the current version ✅');
    //   logger(stringify({ from: version, to: VERSION }));

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

  static parseState = (state?: string): WaterSupplyMacrosState => {
    if (!state) {
      return {
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
    const nextOutput: WaterSupplyMacrosNextOutput = {
      coldWaterPumps: [],
      valves: [],
      boilerPumps: [],
      recirculationPumps: [],
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

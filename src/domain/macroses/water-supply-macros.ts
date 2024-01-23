import debug from 'debug';

import { stringify } from '../../helpers/json-stringify';
import { ControlType } from '../control-type';
import { HyperionDevice } from '../hyperion-device';

import { Macros, MacrosAccept, MacrosParameters, MacrosType } from './macros';

const logger = debug('hyperion-water-supply-macros');

/**
 * ! SETTINGS
 */
export type WaterSupplyMacrosSettings = {
  /**
   * Датчики протечки, почти всегда их будет несколько.
   */
  readonly leaks: Array<{
    readonly deviceId: string;
    readonly controlId: string;
  }>;
  /**
   * Счетчик холодной воды, почти всегда будет один, но можно добавить несколько и вести учет по нескольким линиям.
   */
  readonly coldWaterCounter: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly ticBy: 'FRONT' | 'BACK' | 'BOTH';
    readonly valueByTic: number;
  }>;
  /**
   * Счетчик горячей воды, почти всегда будет один, но можно добавить несколько и вести учет по нескольким линиям.
   */
  readonly hotWaterCounter: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly ticBy: 'FRONT' | 'BACK' | 'BOTH';
    readonly valueByTic: number;
  }>;
  /**
   * Реле питание насоса, почти всегда будет одно, но если используется несколько насосов то можно выключить их все.
   * Рекомендуется использовать НО реле, чтобы при пропадании питания реле переключилось в открытое положение.
   */
  readonly pump: Array<{
    readonly deviceId: string;
    readonly controlId: string;
  }>;
  /**
   * Двух-трех позиционное или аналоговое управление запорной арматурой.
   * Устройств может быть несколько, и они могут быть связаны с конкретными датчиками протечки.
   * Запорная арматура может быть:
   * 1. Кран с фазным управлением, без сигнальных линий
   * 2. Кран с фазным управлением, с сигнальными линиями
   * 3. Клапан с релейным управлением открыто/закрыто, без сигнальных линий.
   * 4. Кран с порционном управлением 0-10В
   */
  readonly valve: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly device: 'PHASE' | 'VALVE' | 'ANALOG';
    readonly functionality: 'OPENING' | 'CLOSING' | 'POWER' | 'SIGNAL' | 'POSITION';
    /**
     * Можно связать краны с датчиками протечки, чтобы не перекрывать всю воду.
     */
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
  }>;
  /**
   * Насос рециркуляции, чаще всего он будет один, но можно управлять несколькими
   */
  readonly recycling: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    /**
     * Если указан один из датчиков, и хотя бы один срабатывает то циркуляция включается.
     *
     * Если не указаны, то будет включен постоянно.
     *
     * Отключается при протечке указанных датчиков, либо если не указан ни один датчик
     * протечки, при срабатывании любого датчика.
     */
    readonly switcher: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly trigger: string;
    }>;
    readonly motion: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly trigger: number;
    }>;
    readonly noise: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly trigger: number;
    }>;
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    /**
     * Если задано расписание и не заданы переключатели, то циркуляция будет включаться
     * во время ON и выключаться во время OFF.
     *
     * Время задается в формате 0-24 часа.
     * Временные интервалы могут пересекаться, учитываются все интервалы в сумме.
     */
    readonly schedule: Array<{
      on: string;
      off: string;
    }>;
  }>;
  /**
   * Датчик температуры бойлера или бойлеров, если их несколько.
   * Если температура ниже hotWaterTemperature в WaterSupplyMacrosPublicState на каком либо датчике,
   * то включится загрузка бойлера.
   * Включится boilerPump, и в макросе отопления будет оформлен запрос на температуру.
   */
  readonly hotWaterTemperature: Array<{
    readonly deviceId: string;
    readonly controlId: string;
  }>;
  /**
   * Насос загрузки бойлера или возможно будет несколько насосов для загрузки нескольких бойлеров.
   * Включается когда активируется режим загрузки бойлера.
   */
  readonly boilerPump: Array<{
    readonly deviceId: string;
    readonly controlId: string;
  }>;
};

/**
 * ! STATE
 */
export type WaterSupplyMacrosPublicState = {
  water: 'ON' | 'OFF';
  timer: 'FORCE' | 'DEFAULT';
  hotWaterTemperature: number;
};

type WaterSupplyMacrosPrivateState = {
  isLeak: boolean;
  pump: 'ON' | 'OFF';
  valve: 'ON' | 'OFF';
  recycling: 'ON' | 'OFF';
};

type WaterSupplyMacrosState = WaterSupplyMacrosPublicState & WaterSupplyMacrosPrivateState;

/**
 * ! OUTPUT
 */
type WaterSupplyMacrosNextOutput = {
  readonly pump: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly valve: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly device: 'PHASE' | 'VALVE' | 'ANALOG';
    readonly functionality: 'OPENING' | 'CLOSING' | 'POWER' | 'SIGNAL' | 'POSITION';
    readonly value: string;
  }>;
  readonly boilerPump: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = MacrosParameters<WaterSupplyMacrosSettings, WaterSupplyMacrosPublicState>;

export class LightingMacros extends Macros<MacrosType.WATER_SUPPLY, WaterSupplyMacrosSettings, WaterSupplyMacrosState> {
  private nextOutput: WaterSupplyMacrosNextOutput;

  constructor(parameters: LightingMacrosParameters) {
    super({
      ...parameters,
      type: MacrosType.WATER_SUPPLY,
      state: {
        water: 'OFF',
        timer: 'DEFAULT',
        hotWaterTemperature: 60,
        isLeak: false,
        pump: 'OFF',
        valve: 'OFF',
        recycling: 'OFF',
      },
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
    });

    this.nextOutput = {
      pump: [],
      valve: [],
      boilerPump: [],
    };
  }

  setState = (nextState: WaterSupplyMacrosState): void => {};

  accept = ({ previous, current, devices, controls }: MacrosAccept): void => {
    super.accept({ previous, current, devices, controls });

    if (this.isDevicesReady() && this.isControlValueHasBeenChanged(current)) {
      this.execute();
    }
  };

  protected execute = () => {
    let stop = this.applyStateToOutput();

    if (stop) {
      return;
    }

    stop = this.applyInputToState();

    if (stop) {
      return;
    }

    this.applyOutputToState();
  };

  protected applyStateToOutput = () => {
    return false;
  };

  protected applyInputToState = () => {
    return false;
  };

  protected applyOutputToState() {}

  protected computeNextOutput = (value: string) => {
    const nextOutput: WaterSupplyMacrosNextOutput = {
      pump: [],
      valve: [],
      boilerPump: [],
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

  protected applyNextOutput = () => {};

  /**
   * ! Реализации частных случаев.
   */
  protected isControlValueHasBeenChanged = (device: HyperionDevice): boolean => {
    return super.isControlValueHasBeenChanged(device, [...this.settings.leaks]);
  };

  protected isSwitchHasBeenPress = (): boolean => {
    return super.isSwitchHasBeenPress(this.settings.leaks);
  };

  protected isSwitchHasBeenRelease = (): boolean => {
    return super.isSwitchHasBeenRelease(this.settings.leaks);
  };
}

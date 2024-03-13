/* eslint-disable unicorn/no-empty-file */
// import debug from 'debug';

// import { stringify } from '../../../helpers/json-stringify';
// import { HyperionDevice } from '../../hyperion-device';
// import { Macros, MacrosAccept, MacrosParameters } from '../macros';
// import { MacrosType } from '../showcase';

// const logger = debug('hyperion-water-supply-macros');

// /**
//  * ! SETTINGS
//  */
// export type WaterSupplyMacrosSettings = {
//   /**
//    * Список устройств которые участвую в макросе
//    */
//   readonly devices: {
//     /**
//      * Счетчик холодной воды, почти всегда будет один,
//      *  но можно добавить несколько и вести учет по нескольким линиям.
//      */
//     readonly coldWaterCounter: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Реле питание насоса водоснабжения, почти всегда будет одно,
//      *  но если используется несколько насосов то можно выключить их все.
//      *
//      * Рекомендуется использовать НО (нормально открытое) реле,
//      *  чтобы при пропадании питания реле переключилось в открытое положение.
//      */
//     readonly pump: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Счетчик горячей воды, почти всегда будет один, но можно добавить несколько и вести учет по нескольким линиям.
//      */
//     readonly hotWaterCounter: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Датчик температуры бойлера или бойлеров, если их несколько.
//      *
//      * Если температура ниже hotWaterTemperature в WaterSupplyMacrosPublicState на каком либо датчике,
//      * то включится загрузка бойлера.
//      *
//      * Включится boilerPump, и в макросе отопления будет оформлен запрос на температуру.
//      */
//     readonly hotWaterTemperature: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;
//     /**
//      * Насос загрузки бойлера или возможно будет несколько насосов для загрузки нескольких бойлеров.
//      *
//      * Включается когда активируется режим загрузки бойлера.
//      */
//     readonly boilerLoadPump: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Насос рециркуляции ГВС, чаще всего он будет один, но можно управлять несколькими
//      */
//     readonly recycling: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//       /**
//        * Если указан один из датчиков, и хотя бы один срабатывает то циркуляция включается.
//        *
//        * Если не указаны, то будет включен постоянно.
//        *
//        * Отключается при протечке указанных датчиков, либо если не указан ни один датчик
//        * протечки, при срабатывании любого датчика.
//        */
//       readonly switcher: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: string;
//       }>;
//       readonly motion: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: number;
//       }>;
//       readonly noise: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: number;
//       }>;
//       readonly leaks: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//       }>;
//       /**
//        * Если задано расписание и не заданы переключатели, то циркуляция будет включаться
//        * во время ON и выключаться во время OFF.
//        *
//        * Время задается в формате 0-24 часа.
//        * Временные интервалы могут пересекаться, учитываются все интервалы в сумме.
//        */
//       readonly schedule: Array<{
//         on: string;
//         off: string;
//       }>;
//     }>;

//     /**
//      * Датчики протечки, почти всегда их будет несколько.
//      */
//     readonly leaks: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Сигналы от кранов, для определения положения открыто, закрыто, в процессе переключения.
//      */
//     readonly signals: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Двух-трех позиционное или аналоговое управление запорной арматурой.
//      *
//      * Устройств может быть несколько, и они могут быть связаны с
//      *  конкретными датчиками протечки.
//      *
//      * Запорная арматура может быть:
//      * 1. Кран с фазным управлением, без сигнальных линий
//      * 2. Кран с фазным управлением, с сигнальными линиями
//      * 3. Кран с порционном управлением 0-10В
//      */
//     readonly valve: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//       readonly device: 'PHASE' | 'PHASE_AND_SIGNAL' | 'ANALOG';
//       readonly functionality: 'OPENING' | 'CLOSING' | 'POWER' | 'SIGNAL' | 'POSITION';

//       /**
//        * Сигналы от крана, для определения положения открыто, закрыто, в процессе переключения.
//        */
//       readonly signals: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//       }>;

//       /**
//        * Можно связать краны с датчиками протечки, чтобы не перекрывать всю воду.
//        *
//        * Если список пустой, то кран работает по сигналу всех датчиков протечки.
//        */
//       readonly leaks: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//       }>;
//     }>;
//   };
//   readonly properties: {
//     readonly coldWaterCounter: {
//       readonly ticBy: 'FRONT' | 'BACK' | 'BOTH';
//       readonly valueByTic: number;
//     };
//     readonly hotWaterCounter: {
//       readonly ticBy: 'FRONT' | 'BACK' | 'BOTH';
//       readonly valueByTic: number;
//     };
//   };
// };

// /**
//  * ! STATE
//  */
// export type WaterSupplyMacrosPublicState = {
//   water: 'ON' | 'OFF';
//   timer: 'FORCE' | 'DEFAULT';
//   hotWaterTemperature: number;
// };

// type WaterSupplyMacrosPrivateState = {
//   isLeak: boolean;
//   pump: 'ON' | 'OFF';
//   valve: 'ON' | 'OFF';
//   recycling: 'ON' | 'OFF';
// };

// type WaterSupplyMacrosState = WaterSupplyMacrosPublicState & WaterSupplyMacrosPrivateState;

// /**
//  * ! OUTPUT
//  */
// type WaterSupplyMacrosNextOutput = {
//   readonly pump: Array<{
//     readonly deviceId: string;
//     readonly controlId: string;
//     readonly value: string;
//   }>;
//   readonly valve: Array<{
//     readonly deviceId: string;
//     readonly controlId: string;
//     readonly device: 'PHASE' | 'VALVE' | 'ANALOG';
//     readonly functionality: 'OPENING' | 'CLOSING' | 'POWER' | 'SIGNAL' | 'POSITION';
//     readonly value: string;
//   }>;
//   readonly boilerPump: Array<{
//     readonly deviceId: string;
//     readonly controlId: string;
//     readonly value: string;
//   }>;
// };

// type WaterSupplyMacrosParameters = MacrosParameters<WaterSupplyMacrosSettings, WaterSupplyMacrosPublicState>;

// export class WaterSupplyMacros extends Macros<
//   MacrosType.WATER_SUPPLY,
//   WaterSupplyMacrosSettings,
//   WaterSupplyMacrosState
// > {
//   private nextOutput: WaterSupplyMacrosNextOutput;

//   constructor(parameters: WaterSupplyMacrosParameters) {
//     super({
//       ...parameters,
//       type: MacrosType.WATER_SUPPLY,
//       state: {
//         water: 'OFF',
//         timer: 'DEFAULT',
//         hotWaterTemperature: 60,
//         isLeak: false,
//         pump: 'OFF',
//         valve: 'OFF',
//         recycling: 'OFF',
//       },
//       controlTypes: {
//         leaks: ControlType.SWITCH,
//         coldWaterCounter: ControlType.SWITCH,
//         hotWaterCounter: ControlType.SWITCH,
//         pump: ControlType.SWITCH,
//         valve: ControlType.SWITCH,
//         recycling: ControlType.SWITCH,
//         hotWaterTemperature: ControlType.TEMPERATURE,
//         boilerPump: ControlType.SWITCH,
//       },
//     });

//     this.nextOutput = {
//       pump: [],
//       valve: [],
//       boilerPump: [],
//     };
//   }

//   setState = (nextState: WaterSupplyMacrosState): void => {};

//   accept = ({ previous, current, devices, controls }: MacrosAccept): void => {
//     super.accept({ previous, current, devices, controls });

//     if (this.isDevicesReady() && this.isControlValueHasBeenChanged(current)) {
//       this.execute();
//     }
//   };

//   protected execute = () => {
//     let interrupt = this.applyPublicState();

//     if (interrupt) {
//       return;
//     }

//     interrupt = this.applyInput();

//     if (interrupt) {
//       return;
//     }

//     this.applyExternalValue();
//   };

//   protected applyPublicState = () => {
//     return false;
//   };

//   protected applyInput = () => {
//     return false;
//   };

//   protected applyExternalValue() {}

//   protected computeOutput = (value: string) => {
//     const nextOutput: WaterSupplyMacrosNextOutput = {
//       pump: [],
//       valve: [],
//       boilerPump: [],
//     };

//     this.nextOutput = nextOutput;

//     logger('The next output was computed ⏭️ 🍋');
//     logger(
//       stringify({
//         name: this.name,
//         nextState: this.state,
//         nextOutput: this.nextOutput,
//       }),
//     );
//   };

//   protected applyOutput = () => {};

//   /**
//    * ! Реализации частных случаев.
//    */
//   protected isControlValueHasBeenChanged = (device: HyperionDevice): boolean => {
//     return super.isControlValueHasBeenChanged(device);
//   };

//   protected isSwitchHasBeenUp = (): boolean => {
//     return super.isSwitchHasBeenUp(this.settings.leaks);
//   };

//   protected isSwitchHasBeenDown = (): boolean => {
//     return super.isSwitchHasBeenDown(this.settings.leaks);
//   };
// }

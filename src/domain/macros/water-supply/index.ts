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
//   readonly devices: {
//     /**
//      * Счетчик холодной воды.
//      *
//      * Допустимо использовать нескольких счетчиков.
//      */
//     readonly coldWaterCounter: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Реле питание насоса водоснабжения.
//      *
//      * Позволяет отключать питание насоса в случае протечки.
//      *
//      * Допустимо использование нескольких насосов.
//      *
//      * Рекомендуется использовать НО (нормально открытое) реле,
//      *  чтобы при пропадании питания реле переключилось в открытое положение.
//      */
//     readonly pump: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Датчики протечки.
//      */
//     readonly leaks: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Сигналы положения кранов.
//      */
//     readonly positions: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Краны защиты от протечки.
//      */
//     readonly valve: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//       readonly type: 'PHASE' | 'ANALOG';

//       /**
//        * Датчики протечки.
//        */
//       readonly leaks: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//       }>;

//       /**
//        * Сигналы положения кранов.
//        *
//        * Если type: 'PHASE' то должно быть два сигнала один ON другой OFF.
//        */
//       readonly positions: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly state: 'ON' | 'OFF';
//       }>;
//     }>;

//     /**
//      * Счетчик горячей воды.
//      *
//      * Допустимо использовать нескольких счетчиков.
//      */
//     readonly hotWaterCounter: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Датчик температуры бойлера.
//      */
//     readonly boilerTemperature: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;
//     }>;

//     /**
//      * Насос загрузки бойлера.
//      *
//      * Допустимо использовать несколько насосов, что соответствует нескольким бойлерам.
//      *
//      * Реализует функцию параллельной загрузки бойлера.
//      */
//     readonly boilerPump: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;

//       /**
//        * Уникальный идентификатор источника тепла, в
//        * котором нужно будет запросить тепло для загрузки бойлера.
//        */
//       readonly heatSources: string[];
//     }>;

//     /**
//      * Насос рециркуляции ГВС.
//      *
//      * Допустимо использовать несколько насосов.
//      */
//     readonly recyclingPump: Array<{
//       readonly deviceId: string;
//       readonly controlId: string;

//       /**
//        * В случае реакции на переключатель запускается рециркуляция на delayMin
//        */
//       readonly switcher: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: string;
//         readonly delayMin: number;
//       }>;

//       /**
//        * В случае реакции на движение запускается рециркуляция на delayMin
//        */
//       readonly motion: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: number;
//         readonly delayMin: number;
//       }>;

//       /**
//        * В случае реакции на шум запускается рециркуляция на delayMin
//        */
//       readonly noise: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//         readonly trigger: number;
//         readonly delayMin: number;
//       }>;

//       /**
//        * При возникновении протечки, рециркуляция отключается.
//        */
//       readonly leaks: Array<{
//         readonly deviceId: string;
//         readonly controlId: string;
//       }>;

//       /**
//        * Расписание включения рециркуляции.
//        *
//        * Если список пустой, то рециркуляция активная все время.
//        *
//        * Если указаны диапазоны времени, то все они складываются и в результирующих диапазонах
//        *  рециркуляция активна.
//        *
//        * Требуется указание даты в формате ISO '2024-03-16T07:31:20.331Z'.
//        */
//       readonly schedule: Array<{
//         from: string;
//         to: string;
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

//     this.applyExternalToState();
//   };

//   protected applyPublicState = () => {
//     return false;
//   };

//   protected applyInput = () => {
//     return false;
//   };

//   protected applyExternalToState() {}

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

//   protected applyNextOutput = () => {};

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

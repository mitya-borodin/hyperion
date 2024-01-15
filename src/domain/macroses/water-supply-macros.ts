import EventEmitter from 'node:events';

import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import { v4 } from 'uuid';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { JsonObject } from '../../helpers/json-types';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
// eslint-disable-next-line max-len
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { Macros, MacrosAccept, MacrosType } from './macros';

const logger = debug('hyperion-hyperion-water-supply-macros');

export type WaterSupplyMacrosSettings = {
  readonly buttons: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly trigger: string;
  }>;
};

type WaterSupplyMacrosNextControlState = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type WaterSupplyMacrosPublicState = JsonObject;

type WaterSupplyMacrosParameters = {
  eventBus: EventEmitter;
  id?: string;
  name: string;
  description: string;
  labels: string[];
  settings: WaterSupplyMacrosSettings;
  state: JsonObject;

  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
};

export class WaterSupplyMacros implements Macros<MacrosType.WATER_SUPPLY, JsonObject, WaterSupplyMacrosSettings> {
  /**
   * ! Общие зависимости всех макросов
   */
  readonly eventBus: EventEmitter;

  /**
   * ! Данные устройств
   */
  private devices: Map<string, HyperionDevice>;
  private previous: Map<string, HyperionDeviceControl>;
  private controls: Map<string, HyperionDeviceControl>;

  /**
   * ! Общие параметры всех макросов
   */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];

  /**
   * ! Уникальные параметры макроса
   */
  readonly type: MacrosType.WATER_SUPPLY;
  readonly settings: WaterSupplyMacrosSettings;
  readonly state: JsonObject;

  /**
   * ! Следующее состояние контролов находящихся под управлением
   */
  private nextOutput: WaterSupplyMacrosNextControlState;

  constructor({ eventBus, devices, controls, id, name, description, labels, settings }: WaterSupplyMacrosParameters) {
    /**
     * ! Общие зависимости всех макросов
     */
    this.eventBus = eventBus;

    /**
     * ! Данные устройств
     */
    this.devices = cloneDeep(devices);
    this.previous = new Map();
    this.controls = cloneDeep(controls);

    /**
     * ! Общие параметры всех макросов
     */
    this.id = id ?? v4();
    this.name = name;
    this.description = description;
    this.labels = labels;

    /**
     * ! Уникальные параметры макроса
     */
    this.type = MacrosType.WATER_SUPPLY;
    this.settings = settings;
    this.state = {};

    /**
     * ! Следующее состояние контролов находящихся под управлением
     */
    this.nextOutput = {
      lightings: [],
    };

    /**
     * ! Проверка на наличие и соответствие типам.
     */
    for (const setting of this.settings.buttons) {
      const button = this.controls.get(getControlId(setting));

      if (!button || button.type !== ControlType.SWITCH) {
        logger('Button control not found or is not SWITCH 🚨');
        logger(stringify({ name: this.name, setting, button }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    /**
     * ! Ждем 500 мс, между появлением сообщений от контроллера.
     */
    this.updateStateByOutputControls = debounce(this.updateStateByOutputControls.bind(this), 500, {
      leading: false,
      trailing: true,
    });
  }

  toJS = () => {
    return cloneDeep({
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      labels: this.labels,
      settings: this.settings,
      state: this.state,
    });
  };

  setState = (state: WaterSupplyMacrosPublicState): void => {
    this.execute();
  };

  accept = ({ devices, previous, controls, device }: MacrosAccept): void => {
    this.devices = devices;
    this.previous = previous;
    this.controls = controls;

    if (this.isNeedToExecute(device)) {
      this.execute();
    }
  };
}

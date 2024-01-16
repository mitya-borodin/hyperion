import EventEmitter from 'node:events';

import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import omit from 'lodash.omit';
import { v4 } from 'uuid';

import { stringify } from '../../helpers/json-stringify';
import { JsonObject } from '../../helpers/json-types';
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';

const logger = debug('hyperion-macros');

/**
 * ! ADD_MACROS
 */
export enum MacrosType {
  LIGHTING = 'LIGHTING',
  CURTAINS_OPENING = 'CURTAINS_OPENING',
  HEATING = 'HEATING',
  WATER_SUPPLY = 'WATER_SUPPLY',
  HEATED_TOWEL_RAILS = 'HEATED_TOWEL_RAILS',
  VENTILATION = 'VENTILATION',
  HUMIDIFICATION = 'HUMIDIFICATION',
  CONDITIONING = 'CONDITIONING',
  HEATING_CABLE = 'HEATING_CABLE',
  GATE_OPENING = 'GATE_OPENING',
  SECURITY = 'SECURITY',
  ACCOUNTING = 'ACCOUNTING',
  UPS = 'UPS',
  AUTOMATIC_RESERVE_ENTRY = 'AUTOMATIC_RESERVE_ENTRY',
  MASTER_SWITCH = 'MASTER_SWITCH',
}

export type MacrosAccept = {
  devices: Map<string, HyperionDevice>;
  previous: Map<string, HyperionDeviceControl>;
  controls: Map<string, HyperionDeviceControl>;
  device: HyperionDevice;
};

export type MacrosEject<TYPE extends MacrosType, SETTINGS extends JsonObject, STATE extends JsonObject> = {
  id: string;
  name: string;
  description: string;
  labels: string[];

  type: TYPE;
  settings: SETTINGS;

  state: STATE;
};

export type MacrosParameters<TYPE extends MacrosType, SETTINGS extends JsonObject, STATE extends JsonObject> = {
  readonly eventBus: EventEmitter;

  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];

  readonly type: TYPE;
  readonly settings: SETTINGS;

  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;

  readonly state: STATE;
};

export abstract class Macros<TYPE extends MacrosType, SETTINGS extends JsonObject, STATE extends JsonObject> {
  /**
   * ! Общие зависимости всех макросов
   */
  protected readonly eventBus: EventEmitter;

  /**
   * ! Данные устройств
   */
  protected devices: Map<string, HyperionDevice>;
  protected previous: Map<string, HyperionDeviceControl>;
  protected controls: Map<string, HyperionDeviceControl>;

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
  readonly type: TYPE;
  readonly settings: SETTINGS;
  protected readonly state: STATE;

  constructor({
    eventBus,
    id,
    name,
    description,
    labels,
    type,
    settings,
    devices,
    controls,
    state,
  }: MacrosParameters<TYPE, SETTINGS, STATE>) {
    this.eventBus = eventBus;

    this.devices = cloneDeep(devices);
    this.previous = new Map();
    this.controls = cloneDeep(controls);

    this.id = id ?? v4();
    this.name = name;
    this.description = description;
    this.labels = labels;

    this.type = type;
    this.settings = settings;

    this.state = state;

    this.applyOutputToState = debounce(this.applyOutputToState.bind(this), 500, {
      leading: false,
      trailing: true,
    });

    this.applyOutputToState();
  }

  abstract setState(state: STATE): void;

  accept({ devices, previous, controls }: MacrosAccept): void {
    this.devices = devices;
    this.previous = previous;
    this.controls = controls;
  }

  protected abstract execute(): void;

  protected abstract applyStateToOutput(): boolean;

  protected abstract applyInputToState(): boolean;

  protected abstract applyOutputToState(): void;

  protected abstract computeNextOutput(value: string): void;

  protected abstract applyNextOutput(): void;

  toJS = (): MacrosEject<TYPE, SETTINGS, STATE> => {
    return cloneDeep({
      id: this.id,
      name: this.name,
      description: this.description,
      labels: this.labels,

      type: this.type,
      settings: this.settings,

      state: this.state,
    });
  };

  /**
   * ! Реализации частных случаев.
   */
  protected isControlValueHasBeenChanged(
    device: HyperionDevice,
    controls: Array<{ deviceId: string; controlId: string }>,
  ): boolean {
    for (const control of device.controls) {
      const isSuitableControl = controls.find(
        ({ deviceId, controlId }) => deviceId === device.id && controlId === control.id,
      );

      if (isSuitableControl) {
        const id = getControlId({ deviceId: device.id, controlId: control.id });

        const previous = this.previous.get(id);
        const current = this.controls.get(id);

        if (previous?.value !== current?.value) {
          logger('A suitable control has been detected 🕵️‍♂️ 🕵️‍♂️ 🕵️‍♂️');
          logger(
            stringify({
              macros: omit(this.toJS(), ['labels', 'settings']),
              device: { id: device.id, controls: device.controls.map(({ id, value }) => ({ id, value })) },
            }),
          );

          return true;
        }
      }
    }

    return false;
  }

  protected isSwitchHasBeenPress(switches: Array<{ deviceId: string; controlId: string }>): boolean {
    return switches.some((item) => {
      const previous = this.previous.get(getControlId(item));
      const current = this.controls.get(getControlId(item));

      if (!previous || !current) {
        return false;
      }

      if (current.type === ControlType.SWITCH && previous.value !== current.value && current.value === current.on) {
        return true;
      }

      return false;
    });
  }

  protected isSwitchHasBeenRelease(switches: Array<{ deviceId: string; controlId: string }>): boolean {
    return switches.some((item) => {
      const previous = this.previous.get(getControlId(item));
      const current = this.controls.get(getControlId(item));

      if (!previous || !current) {
        return false;
      }

      if (
        current.type === ControlType.SWITCH &&
        previous.value !== current.value &&
        previous.value === current.on &&
        current.value === current.off
      ) {
        return true;
      }

      return false;
    });
  }
}

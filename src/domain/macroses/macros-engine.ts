import EventEmitter from 'node:events';

import cloneDeep from 'lodash.clonedeep';
import { Logger } from 'pino';

import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { LightingMacros, LightingMacrosSettings, LightingMacrosState } from './lighting-macros';
import { MacrosType } from './macros';

type M = LightingMacros;
type S = { [MacrosType.LIGHTING]: LightingMacrosSettings };
type T = { [MacrosType.LIGHTING]: LightingMacrosState };

type Setup = {
  id?: string;
  type: MacrosType;
  name: string;
  description: string;
  labels: string[];
  settings: S;
};

type MacrosEngineParameters = {
  logger: Logger;
  eventBus: EventEmitter;
};

export class MacrosEngine {
  readonly logger: Logger;
  readonly eventBus: EventEmitter;
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly macros: Map<string, M>;

  constructor({ logger, eventBus }: MacrosEngineParameters) {
    this.logger = logger;
    this.eventBus = eventBus;

    this.devices = new Map();
    this.controls = new Map();
    this.macros = new Map();
  }

  start = () => {
    this.eventBus.on(EventBus.WB_APPEARED, this.accept);
  };

  stop = () => {
    this.eventBus.off(EventBus.WB_APPEARED, this.accept);
  };

  setup = ({ id, type, name, description, labels, settings }: Setup): void => {
    let macros: M | undefined;

    if (type === MacrosType.LIGHTING) {
      macros = new LightingMacros({
        logger: this.logger,
        eventBus: this.eventBus,
        id,
        name,
        description,
        labels,
        settings: settings[type],
      });
    }

    if (macros) {
      this.macros.set(id ?? macros.id, macros);
    }
  };

  setState = (id: string, state: T) => {
    const macros = this.macros.get(id);

    if (macros?.type === MacrosType.LIGHTING) {
      macros.setState(state[macros?.type]);
    }
  };

  private accept = (device: HyperionDevice): void => {
    this.devices.set(device.id, device);

    const previous = new Map();

    for (const control of device.controls) {
      const id = `${device.id}/${control.id}`;

      previous.set(id, cloneDeep(this.controls.get(id)));

      this.controls.set(id, control);
    }

    for (const macros of this.macros.values()) {
      macros.accept({ devices: this.devices, previous, controls: this.controls });
    }
  };
}

import EventEmitter from 'node:events';

import cloneDeep from 'lodash.clonedeep';
import { Logger } from 'pino';

import { ErrorType } from '../../helpers/error-type';
import { IMacrosSettingsRepository } from '../../ports/macros-settings-repository';
import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { LightingMacros, LightingMacrosPublicState, LightingMacrosSettings } from './lighting-macros';
import { MacrosType } from './macros';

type M = LightingMacros;
type T = { [MacrosType.LIGHTING]: LightingMacrosPublicState };
type S = { [MacrosType.LIGHTING]: LightingMacrosSettings };

/**
 * ! ADD_MACROS
 */
export type MacrosOptions = { lighting?: LightingMacros };

type Setup = {
  id?: string;
  type: MacrosType;
  name: string;
  description: string;
  labels: string[];
  settings: S;
  state: T;
};

type MacrosEngineParameters = {
  logger: Logger;
  eventBus: EventEmitter;
  macrosSettingsRepository: IMacrosSettingsRepository;
};

export class MacrosEngine {
  readonly logger: Logger;
  readonly eventBus: EventEmitter;
  readonly macrosSettingsRepository: IMacrosSettingsRepository;
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly macros: Map<string, M>;

  constructor({ logger, eventBus, macrosSettingsRepository }: MacrosEngineParameters) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.macrosSettingsRepository = macrosSettingsRepository;

    this.devices = new Map();
    this.controls = new Map();
    this.macros = new Map();
  }

  start = () => {
    this.eventBus.on(EventBus.HD_APPEARED, this.accept);
  };

  stop = () => {
    this.eventBus.off(EventBus.HD_APPEARED, this.accept);
  };

  setup = ({ id, type, name, description, labels, settings, state }: Setup): Error | M => {
    try {
      if (this.devices.size === 0 || this.controls.size === 0) {
        this.logger.error(
          { id, type, name, description, labels, settings },
          'Before installing macros, you need to download device and control data 🚨',
        );

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      let macros: M | undefined;

      /**
       * ! ADD_MACROS
       */
      if (type === MacrosType.LIGHTING) {
        macros = new LightingMacros({
          logger: this.logger,
          eventBus: this.eventBus,

          devices: this.devices,
          controls: this.controls,

          id,
          name,
          description,
          labels,
          settings: settings[type],
          state: state[type],
        });
      }

      if (macros) {
        this.macros.set(macros.id, macros);

        /**
         * TODO Сохранить настройки в БД.
         */

        this.logger.info(
          { id: macros.id, type, name, description, labels, settings, macros },
          'The macro has been successfully installed ✅',
        );

        return macros;
      }

      this.logger.error({ id, type, name, description, labels, settings }, 'Failed to install the macros 🚨');

      return new Error(ErrorType.INVALID_ARGUMENTS);
    } catch (error) {
      this.logger.error(
        { id, type, name, description, labels, settings, err: error },
        'Failed to install the macro, for unforeseen reasons 🚨',
      );

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  };

  destroy = async (id: string) => {
    const macros = this.macros.get(id);

    if (macros) {
      this.macros.delete(id);

      await this.macrosSettingsRepository.destroy(id);

      return macros;
    }

    this.logger.error({ id }, 'Failed to delete macro by ID 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  };

  setState = (id: string, state: T) => {
    const macros = this.macros.get(id);

    /**
     * ! ADD_MACROS
     */
    if (macros?.type === MacrosType.LIGHTING) {
      macros.setState(state[macros?.type]);
    }
  };

  getMarcosList = () => {
    const list: MacrosOptions[] = [];

    for (const macros of this.macros.values()) {
      /**
       * ! ADD_MACROS
       */
      if (macros instanceof LightingMacros) {
        list.push({
          lighting: macros,
        });
      }
    }

    return list;
  };

  private accept = (device: HyperionDevice): void => {
    this.devices.set(device.id, device);

    const previous = new Map();

    for (const control of device.controls) {
      const controlId = getControlId({ deviceId: device.id, controlId: control.id });

      previous.set(controlId, cloneDeep(this.controls.get(controlId)));

      this.controls.set(controlId, control);
    }

    for (const macros of this.macros.values()) {
      macros.accept({ devices: this.devices, previous, controls: this.controls });
    }
  };
}

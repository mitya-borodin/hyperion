import EventEmitter from 'node:events';

import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';

import { ErrorType } from '../../helpers/error-type';
import { IMacrosSettingsRepository } from '../../ports/macros-settings-repository';
import { IWirenboardDeviceRepository } from '../../ports/wirenboard-device-repository';
import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { LightingForce, LightingMacros, LightingMacrosPublicState, LightingMacrosSettings } from './lighting-macros';
import { MacrosType } from './macros';

const logger = debug('hyperion-macros-engine');

/**
 * ! ADD_MACROS
 */
type M = LightingMacros;

/**
 * ! ADD_MACROS
 */
type T = { [MacrosType.LIGHTING]: LightingMacrosPublicState };

/**
 * ! ADD_MACROS
 */
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

  save?: boolean;
};

type MacrosEngineParameters = {
  eventBus: EventEmitter;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
  macrosSettingsRepository: IMacrosSettingsRepository;
};

export class MacrosEngine {
  readonly eventBus: EventEmitter;
  readonly wirenboardDeviceRepository: IWirenboardDeviceRepository;
  readonly macrosSettingsRepository: IMacrosSettingsRepository;
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly macros: Map<string, M>;

  constructor({ eventBus, wirenboardDeviceRepository, macrosSettingsRepository }: MacrosEngineParameters) {
    this.eventBus = eventBus;
    this.wirenboardDeviceRepository = wirenboardDeviceRepository;
    this.macrosSettingsRepository = macrosSettingsRepository;

    this.devices = new Map();
    this.controls = new Map();
    this.macros = new Map();
  }

  private accept = (device: HyperionDevice): void => {
    this.devices.set(device.id, device);

    const previous = new Map();

    for (const control of device.controls) {
      const controlId = getControlId({ deviceId: device.id, controlId: control.id });

      previous.set(controlId, cloneDeep(this.controls.get(controlId)));

      this.controls.set(controlId, control);
    }

    for (const macros of this.macros.values()) {
      macros.accept({ devices: this.devices, previous, controls: this.controls, device });
    }
  };

  start = async () => {
    const devices = await this.wirenboardDeviceRepository.getAll();

    if (devices instanceof Error) {
      return devices;
    }

    for (const device of devices) {
      this.accept(device);
    }

    const macrosSettings = await this.macrosSettingsRepository.getAll();

    if (macrosSettings instanceof Error) {
      return macrosSettings;
    }

    await Promise.all(
      macrosSettings.map((macrosSetting) => {
        if (macrosSetting.type === MacrosType.LIGHTING) {
          return this.setup({
            id: macrosSetting.id,
            type: macrosSetting.type,
            name: macrosSetting.name,
            description: macrosSetting.description,
            labels: macrosSetting.labels,
            settings: {
              [MacrosType.LIGHTING]: macrosSetting.settings as LightingMacrosSettings,
            },
            state: {
              [MacrosType.LIGHTING]: {
                force: LightingForce.UNSPECIFIED,
              },
            },
            save: false,
          });
        }
      }),
    );

    this.eventBus.on(EventBus.HD_APPEARED, this.accept);

    logger('The macros engine was run successful ✅ 🚀');
  };

  stop = () => {
    this.eventBus.off(EventBus.HD_APPEARED, this.accept);

    logger('The macros engine was stopped 👷‍♂️ 🛑');
  };

  setup = async ({ id, type, name, description, labels, settings, state, save = true }: Setup): Promise<Error | M> => {
    try {
      if (this.devices.size === 0 || this.controls.size === 0) {
        logger('Before installing macros, you need to download device and control data 🚨');
        logger(JSON.stringify({ id, type, name, description, labels, settings }, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      let macros: M | undefined;

      /**
       * ! ADD_MACROS
       */
      if (type === MacrosType.LIGHTING) {
        macros = new LightingMacros({
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
        if (save) {
          const macrosSettings = await this.macrosSettingsRepository.upsert({
            id: macros.id,
            type: macros.type,
            name: macros.name,
            description: macros.description,
            settings: macros.settings,
            labels: macros.labels,
          });

          if (macrosSettings instanceof Error) {
            return macrosSettings;
          }
        }

        this.macros.set(macros.id, macros);

        logger('The macro has been successfully installed ✅');
        logger(
          JSON.stringify(
            { id: macros.id, type, name, description, labels, settings, appliedMAcrosSettings: macros.toJS() },
            null,
            2,
          ),
        );

        return macros;
      }

      logger('Failed to install the macros 🚨');
      logger(JSON.stringify({ id, type, name, description, labels, settings }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    } catch (error) {
      logger('Failed to install the macro, for unforeseen reasons 🚨');
      logger(JSON.stringify({ id, type, name, description, labels, settings, error }, null, 2));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  };

  getMarcosList = () => {
    const list: MacrosOptions[] = [];

    for (const macros of this.macros.values()) {
      /**
       * ! ADD_MACROS - переделать на маппер
       */
      if (macros instanceof LightingMacros) {
        list.push({
          lighting: macros,
        });
      }
    }

    return list;
  };

  setState = (id: string, state: T) => {
    const macros = this.macros.get(id);

    /**
     * ! ADD_MACROS
     */
    if (macros instanceof LightingMacros) {
      macros.setState(state[macros?.type]);
    }

    return macros;
  };

  destroy = async (id: string) => {
    const macros = this.macros.get(id);

    if (macros) {
      const macrosSettings = await this.macrosSettingsRepository.destroy(id);

      if (macrosSettings instanceof Error) {
        return macrosSettings;
      }

      this.macros.delete(id);

      logger('The macros was delete by ID successfully ✅');
      logger(JSON.stringify({ id }, null, 2));

      return macros;
    }

    logger('Failed to delete macro by ID 🚨');
    logger(JSON.stringify({ id }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  };
}

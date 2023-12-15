import EventEmitter from 'node:events';

import cloneDeep from 'lodash.clonedeep';
import { Logger } from 'pino';

import { ErrorType } from '../../helpers/error-type';
import { IMacrosSettingsRepository } from '../../ports/macros-settings-repository';
import { IWirenboardDeviceRepository } from '../../ports/wirenboard-device-repository';
import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { LightingForce, LightingMacros, LightingMacrosPublicState, LightingMacrosSettings } from './lighting-macros';
import { MacrosType } from './macros';

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
  logger: Logger;
  eventBus: EventEmitter;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
  macrosSettingsRepository: IMacrosSettingsRepository;
};

export class MacrosEngine {
  readonly logger: Logger;
  readonly eventBus: EventEmitter;
  readonly wirenboardDeviceRepository: IWirenboardDeviceRepository;
  readonly macrosSettingsRepository: IMacrosSettingsRepository;
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly macros: Map<string, M>;

  constructor({ logger, eventBus, wirenboardDeviceRepository, macrosSettingsRepository }: MacrosEngineParameters) {
    this.logger = logger;
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
      macros.accept({ devices: this.devices, previous, controls: this.controls });
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

    this.logger.info(
      { devices: this.devices.size, controls: this.controls.size, macros: this.macros.size },
      'The macros engine was run successful ✅ 🚀',
    );
  };

  stop = () => {
    this.eventBus.off(EventBus.HD_APPEARED, this.accept);

    this.logger.info(
      { devices: this.devices.size, controls: this.controls.size, macros: this.macros.size },
      'The macros engine was stopped 👷‍♂️ 🛑',
    );
  };

  setup = async ({ id, type, name, description, labels, settings, state, save = true }: Setup): Promise<Error | M> => {
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

        this.logger.info(
          { id: macros.id, type, name, description, labels, settings, macros: macros.toJS() },
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

      this.logger.error({ id }, 'The macros was delete by ID successfully ✅');

      return macros;
    }

    this.logger.error({ id }, 'Failed to delete macro by ID 🚨');

    return new Error(ErrorType.INVALID_ARGUMENTS);
  };
}

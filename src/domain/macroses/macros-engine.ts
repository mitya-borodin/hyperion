/* eslint-disable @typescript-eslint/naming-convention */
import EventEmitter from 'node:events';

import { retry } from 'abort-controller-x';
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { IHyperionDeviceRepository } from '../../ports/hyperion-device-repository';
import { IMacrosSettingsRepository } from '../../ports/macros-settings-repository';
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
type MACROS = LightingMacros;

/**
 * ! ADD_MACROS
 */
type STATE = { [MacrosType.LIGHTING]: LightingMacrosPublicState };

/**
 * ! ADD_MACROS
 */
type SETTINGS = { [MacrosType.LIGHTING]: LightingMacrosSettings };

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
  settings: SETTINGS;
  state: STATE;

  save?: boolean;
};

type MacrosEngineParameters = {
  eventBus: EventEmitter;
  hyperionDeviceRepository: IHyperionDeviceRepository;
  macrosSettingsRepository: IMacrosSettingsRepository;
};

export class MacrosEngine {
  readonly eventBus: EventEmitter;
  readonly hyperionDeviceRepository: IHyperionDeviceRepository;
  readonly macrosSettingsRepository: IMacrosSettingsRepository;
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly macros: Map<string, MACROS>;

  constructor({ eventBus, hyperionDeviceRepository, macrosSettingsRepository }: MacrosEngineParameters) {
    this.eventBus = eventBus;
    this.hyperionDeviceRepository = hyperionDeviceRepository;
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

  start = async (signal: AbortSignal) => {
    return await retry(
      signal,
      async (signal: AbortSignal, attempt: number) => {
        if (attempt >= 10) {
          logger('Attempts to start the macros engine have ended 🚨 🚨 🚨');

          return new Error(ErrorType.ATTEMPTS_ENDED);
        }

        logger('Try to start macros engine 🚀 🚀 🚀');

        const devices = await this.hyperionDeviceRepository.getAll();

        if (devices instanceof Error) {
          return devices;
        }

        for (const device of devices) {
          this.accept(device);
        }

        if (this.areDevicesMissing()) {
          throw new Error(ErrorType.DATA_HAS_NOT_BE_UPLOAD);
        }

        const macrosSettings = await this.macrosSettingsRepository.getAll();

        if (macrosSettings instanceof Error) {
          return macrosSettings;
        }

        for (const macrosSetting of macrosSettings) {
          /**
           * ! ADD_MACROS
           */
          if (macrosSetting.type === MacrosType.LIGHTING) {
            const macros = await this.setup({
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

            if (macros instanceof Error) {
              throw new TypeError(ErrorType.UNEXPECTED_BEHAVIOR);
            }
          }
        }

        this.eventBus.on(EventBus.HYPERION_DEVICE_APPEARED, this.accept);

        logger('The macros engine was run successful ✅ 🚀 🚀 🚀 ⬆️');
      },
      {
        baseMs: 5000,
        maxAttempts: 10,
        onError(error, attempt, delayMs) {
          logger('An attempt to run the macro engine failed 🚨');
          logger(stringify({ attempt, delayMs }));

          console.error(error);
        },
      },
    );
  };

  stop = () => {
    this.eventBus.off(EventBus.HYPERION_DEVICE_APPEARED, this.accept);

    logger('The macros engine was stopped 👷‍♂️ 🛑');
  };

  setup = async (setup: Setup): Promise<Error | MACROS> => {
    const { id, type, name, description, labels, settings, state, save = true } = setup;

    try {
      if (this.areDevicesMissing()) {
        logger('Before installing macros, you need to download device and control data 🚨');
        logger(stringify({ devices: this.devices.size, controls: this.controls.size, setup }));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      let macros: MACROS | undefined;

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
          const macrosSettings = await this.macrosSettingsRepository.upsert(macros.toJS());

          if (macrosSettings instanceof Error) {
            return macrosSettings;
          }
        }

        this.macros.set(macros.id, macros);

        logger('The macro has been successfully installed 🚀 ✅ 🚀');
        logger(
          stringify({
            id: macros.id,
            type: macros.type,
            name: macros.name,
            description: macros.description,
            labels: macros.labels,
          }),
        );

        return macros;
      }

      logger('Failed to install the macros 🚨');
      logger(stringify(setup));

      return new Error(ErrorType.INVALID_ARGUMENTS);
    } catch (error) {
      logger('Failed to install the macro, for unforeseen reasons 🚨');
      logger(stringify({ setup }));

      console.error(error);

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

  setState = (id: string, state: STATE) => {
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
      logger(stringify({ id }));

      return macros;
    }

    logger('Failed to delete macro by ID 🚨');
    logger(stringify({ id }));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  };

  private areDevicesMissing = () => {
    return this.devices.size === 0 || this.controls.size === 0;
  };
}

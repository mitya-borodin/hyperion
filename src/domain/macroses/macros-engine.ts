/* eslint-disable @typescript-eslint/naming-convention */
import EventEmitter from 'node:events';

import debug from 'debug';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { HyperionStateUpdate, IHyperionDeviceRepository } from '../../ports/hyperion-device-repository';
import { IMacrosSettingsRepository } from '../../ports/macros-settings-repository';
import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

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
  private readonly eventBus: EventEmitter;
  private readonly hyperionDeviceRepository: IHyperionDeviceRepository;
  private readonly macrosSettingsRepository: IMacrosSettingsRepository;
  private devices: Map<string, HyperionDevice>;
  private controls: Map<string, HyperionDeviceControl>;
  private readonly macros: Map<string, MACROS>;

  constructor({ eventBus, hyperionDeviceRepository, macrosSettingsRepository }: MacrosEngineParameters) {
    this.eventBus = eventBus;
    this.hyperionDeviceRepository = hyperionDeviceRepository;
    this.macrosSettingsRepository = macrosSettingsRepository;

    this.devices = new Map();
    this.controls = new Map();
    this.macros = new Map();
  }

  private accept = (hyperionState: HyperionStateUpdate): void => {
    for (const macros of this.macros.values()) {
      macros.accept({
        previous: hyperionState.previous,
        current: hyperionState.current,
        devices: hyperionState.devices,
        controls: hyperionState.controls,
      });
    }
  };

  start = async () => {
    logger('Try to start macros engine 🚀 🚀 🚀');

    /**
     * ! Для горячего старта, чтобы не ждать появления всех устройств и контролов.
     */
    const { devices, controls } = await this.hyperionDeviceRepository.getHyperionState();

    this.devices = devices;
    this.controls = controls;

    const macrosSettings = await this.macrosSettingsRepository.getAll();

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

    this.eventBus.on(EventBus.HYPERION_STATE, this.accept);

    logger('The macros engine was run successful ✅ 🚀 🚀 🚀 ⬆️');
  };

  stop = () => {
    this.eventBus.off(EventBus.HYPERION_STATE, this.accept);

    logger('The macros engine was stopped 👷‍♂️ 🛑');
  };

  setup = async (setup: Setup): Promise<Error | MACROS> => {
    const { id, type, name, description, labels, settings, state, save = true } = setup;

    try {
      let macros: MACROS | undefined;

      /**
       * ! ADD_MACROS
       */
      if (type === MacrosType.LIGHTING) {
        macros = new LightingMacros({
          eventBus: this.eventBus,

          id,
          name,
          description,
          labels,
          settings: settings[type],
          state: state[type],

          /**
           * ! Для горячего старта, чтобы не ждать появления всех устройств и контролов.
           */
          devices: this.devices,
          controls: this.controls,
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
        logger(stringify({ id: macros.id, type: macros.type, name: macros.name }));

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
}

/* eslint-disable @typescript-eslint/naming-convention */
import EventEmitter from 'node:events';

import debug from 'debug';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { HyperionStateUpdate, HyperionDevicePort } from '../../ports/hyperion-device-port';
import { MacrosPort } from '../../ports/macros-settings-port';
import { EventBus } from '../event-bus';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { Macros, MacrosEject } from './macros';
import { MacrosType, macrosByType, toDomainMacrosType } from './showcase';

const logger = debug('hyperion-macros-engine');

type Setup = {
  id?: string;
  type: string;
  name: string;
  description: string;
  labels: string[];

  /**
   * Settings & state должны приходить в формате json text, который будет
   * распарсен, каждым макросом в соответствии со своей json schema.
   */
  settings: string;
  /**
   * Settings & state должны приходить в формате json text, который будет
   * распарсен, каждым макросом в соответствии со своей json schema.
   */
  state?: string;

  version?: number;
};

type MacrosEngineParameters = {
  eventBus: EventEmitter;
  hyperionDeviceRepository: HyperionDevicePort;
  macrosRepository: MacrosPort;
};

export class MacrosEngine {
  private readonly eventBus: EventEmitter;
  private readonly hyperionDeviceRepository: HyperionDevicePort;
  private readonly macrosRepository: MacrosPort;
  private devices: Map<string, HyperionDevice>;
  private controls: Map<string, HyperionDeviceControl>;
  private readonly macros: Map<string, Macros>;

  constructor({ eventBus, hyperionDeviceRepository, macrosRepository }: MacrosEngineParameters) {
    this.eventBus = eventBus;
    this.hyperionDeviceRepository = hyperionDeviceRepository;
    this.macrosRepository = macrosRepository;

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

    logger(
      stringify({
        devices: this.devices.size,
        controls: this.controls.size,
      }),
    );

    const allMacrosSettings = await this.macrosRepository.getAll();

    for (const macrosSettings of allMacrosSettings) {
      const macros = await this.setup({
        type: macrosSettings.type,

        id: macrosSettings.id,
        name: macrosSettings.name,
        description: macrosSettings.description,
        labels: macrosSettings.labels,

        /**
         * Удовлетворение контракта метода setup, так как фронт отдает данные всегда
         * в виде JSON text, который в последствии проверяется.
         */
        settings: JSON.stringify(macrosSettings.settings),

        /**
         * Состояние хранится в БД, но если его там нет, то макрос знает свое дефолтное состояние.
         */
        state: JSON.stringify(macrosSettings.state),

        version: macrosSettings.version,
      });

      if (macros instanceof Error) {
        throw new TypeError(ErrorType.UNEXPECTED_BEHAVIOR);
      }
    }

    this.eventBus.on(EventBus.HYPERION_STATE, this.accept);

    logger('The macros engine was run successful ✅ 🚀 🚀 🚀 ⬆️');
  };

  stop = () => {
    this.eventBus.off(EventBus.HYPERION_STATE, this.accept);

    logger('The macros engine was stopped 👷‍♂️ 🛑');
  };

  setup = async (setup: Setup): Promise<Error | MacrosEject> => {
    const { id, name, description, labels, settings, state, version } = setup;

    try {
      logger('Try to setup macros ⛹️‍♀️');
      logger(
        stringify({
          id,
          name,
          description,
          labels,
          devices: this.devices.size,
          controls: this.controls.size,
        }),
      );

      const type = toDomainMacrosType(setup.type);

      if (type === MacrosType.UNSPECIFIED) {
        logger('Failed to install the macros 🚨');
        logger(stringify(setup));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const Macros = macrosByType[type];

      let macros: Macros | undefined;

      if (Macros) {
        macros = new Macros({
          macrosRepository: this.macrosRepository,
          eventBus: this.eventBus,

          id,
          name,
          description,
          labels,

          settings,

          state,

          version,

          /**
           * ! Для горячего старта, чтобы не ждать появления всех устройств и контролов.
           */
          devices: this.devices,
          controls: this.controls,
        });
      } else {
        logger('The macro constructor is unavailable 🚨');
        logger(stringify(setup));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      if (macros) {
        const macrosData = await this.macrosRepository.upsert(macros);

        if (macrosData instanceof Error) {
          return macrosData;
        }

        this.macros.set(macros.id, macros);

        logger('The macro has been successfully installed 🚀 ✅ 🚀');
        logger(stringify({ id: macros.id, type: macros.type, name: macros.name }));

        return macros.toJS();
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

  getList = () => {
    return Array.from(this.macros.values(), (macros) => macros.toJS());
  };

  setState = (id: string, state: string) => {
    const macros = this.macros.get(id);

    if (macros) {
      macros.setState(state);
    }

    return macros;
  };

  destroy = async (id: string) => {
    const macros = this.macros.get(id);

    if (macros) {
      const macrosData = await this.macrosRepository.destroy(id);

      if (macrosData instanceof Error) {
        return macrosData;
      }

      this.macros.delete(id);

      logger('The macros was delete by ID successfully ✅');
      logger(stringify({ id }));

      return macros.toJS();
    }

    logger('Failed to delete macro by ID 🚨');
    logger(stringify({ id }));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  };
}

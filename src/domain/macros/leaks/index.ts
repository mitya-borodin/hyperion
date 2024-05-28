/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable unicorn/no-empty-file */
import { addSeconds, compareAsc } from 'date-fns';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:leaks');

/**
 * ! SETTINGS
 */

/**
 * Текущее положение крана
 */
export enum ValueState {
  UNSPECIFIED = 'UNSPECIFIED',
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
}

/**
 * Защита от протечек.
 *
 * Позволяет защищать от протечек воды и газа.
 *
 * Макрос отвечает только за изменение положение крана,
 * и никак не заботится последствиями перекрытия крана.
 *
 * Макросы управляющие газовым или водяным оборудование
 * должны отслеживать положение требуемых для их работы кранов,
 * и если краны переходят в состояние ЗАКРЫТО, то прекращать
 * работу оборудования.
 */
export type LeaksMacrosSettings = {
  readonly devices: {
    /**
     * Датчики протечки
     *
     * Датчики протечки могут быть проводные реализованные как SWITCH и
     * без проводными возвращающие некий action из предоставленного ENUM значений.
     */
    readonly leaks: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH | ControlType.ENUM;
    }>;

    /**
     * Список кранов с управлением на уровне приложения,
     * реализует логику переключателя.
     */
    readonly switch: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    /**
     * Список кранов с управлением на уровне приложения,
     * реализует логику перехода по состояниям перечисленным в enum
     * на всех кранах должно быть установлено одно закрытое положение.
     */
    readonly enum: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ENUM;
    }>;

    /**
     * Краны с управлением на аналоговом уровне,
     * на всех кранах должно быть установлено одно закрытое положение.
     *
     * Все краны должны иметь общую землю с модулем управления.
     */
    readonly analog: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.RANGE;
    }>;

    /**
     * Краны с релейным управлением.
     *
     * На всех кранах должно быть установлено одинаковое закрытое положение, в рамках макроса.
     *
     * ON/OFF - "обычное" реле, которое может подключать/отключить фазу к одному выходу.
     *
     * NC/NO - "специальное" реле, которое может подключать фазу между двумя
     * разными выходами, подключенных к контактам NC/NO.
     *
     * NC - normal close, нормально закрытый контакт, это означает,
     * что когда нет питания, контакт находится в замкнутом положении.
     *
     * NO - normal open, нормально открытый контакт, это означает,
     * что когда нет питания, контакт находится в разомкнутом положении.
     *
     * Для специальных модулей реле WBIO-DO-R10R-4, имеется возможность подать/снять питание
     * и переключать фазу между NC/NO, нет питания фаза идет через NC, есть питание через NO.
     *
     * Позволяет отключить фазу, переключить направление, и подать фазу, чтобы исключить
     * случай включения двух фаз сразу.
     *
     * Такая схема защищает NO/NC реле от переходных электрических процессов.
     *
     * https://wirenboard.com/ru/product/WBIO-DO-R10R-4/
     */
    readonly phase: Array<{
      /**
       * open - реле отвечающее за открывание крана, может быть как обычное ON/OFF так и NC/NO.
       *
       * В случае ON/OFF реле подключает или отключает фазу которая предназначена для открывания крана,
       * если фаза подключена, кран пытается закрыться.
       *
       * В случае NC/NO реле переключает условно "левое и правое" или "открытое и закрытое" положение
       * крана, но не управляет подключением фазы ни к одному из выходов. В итоге получается, что в положении
       * open.on подключается NO контакт, который подключен к скажем фазе открывания, то в положении
       * open.off подключается NC контакт, который подключен к скажем фазе закрывания.
       *
       * Подключение может быть и на оборот, и в этом случае нужно поменять местами провода, чтобы открывание было
       * на NO контакте, а закрывание на NC контакте.
       */
      readonly open: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * close - реле отвечающее за закрытие крана,
       * присутствует когда выбрано два ON/OFF реле,
       * отсутствует если используется специальная конфигурация WBIO-DO-R10R-4.
       */
      readonly close?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * power - реле отвечающее за подачу питания на выбранную фазу,
       * присутствует только в случае использования специальной конфигурации WBIO-DO-R10R-4.
       */
      readonly power?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * Присутствует в том случае, если у крана есть контакты позволяющие определить открытое состояние.
       */
      readonly isOpen?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };

      /**
       * Присутствует в том случае, если у крана есть контакты позволяющие определить закрытое состояние.
       */
      readonly isClose?: {
        readonly deviceId: string;
        readonly controlId: string;
        readonly controlType: ControlType.SWITCH;
      };
    }>;
  };

  readonly properties: {
    readonly leak: {
      /**
       * Для SWITCH это логическая единица и логический ноль, где единица это наличие протечки.
       */
      readonly switch: string;

      /**
       * Для ENUM это некий action который выбирается пользователь из предоставленного ENUM.
       */
      readonly enum: string;
    };

    readonly enum: {
      readonly open: string;
      readonly close: string;
    };

    readonly analog: {
      readonly open: string;
      readonly close: string;
    };

    readonly phase: {
      readonly durationSec: number;
    };
  };
};

/**
 * ! STATE
 */
export type LeaksMacrosPublicState = {
  /**
   * Жесткое закрытие/открытие крана, закрывает или открывает, и прерывает вычисление дальнейших стадий.
   */
  force: 'UNSPECIFIED' | 'OPEN' | 'CLOSE';

  /**
   * Состояние ожидание подтверждения на открытие крана, в случае отмены возвращается в UNSPECIFIED
   * и при следующей попытке открыть, создается запрос.
   */
  approve: 'UNSPECIFIED' | 'WAIT' | 'APPROVED' | 'CANCELED';
};

type LeaksMacrosPrivateState = {
  leak: boolean;
  valve: ValueState;
};

type LeaksMacrosState = LeaksMacrosPublicState & LeaksMacrosPrivateState;

/**
 * ! OUTPUT
 */
type LeaksMacrosNextOutput = {
  readonly switch: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly enum: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  readonly analog: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
  phase: Array<{
    readonly open?: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
      readonly delaySec: number;
      readonly value: string;
    };
    readonly close?: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
      readonly delaySec: number;
      readonly value: string;
    };
    readonly power?: {
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
      readonly delaySec: number;
      readonly value: string;
    };
  }>;
};

const VERSION = 0;

type LeaksMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: LeaksMacrosState = {
  force: 'UNSPECIFIED',
  leak: false,
  approve: 'UNSPECIFIED',
  valve: ValueState.UNSPECIFIED,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class LeaksMacros extends Macros<MacrosType.LEAKS, LeaksMacrosSettings, LeaksMacrosState> {
  private output: LeaksMacrosNextOutput;

  private phase = {
    durationOfActivation: new Date(),
  };

  private timer: {
    controlProgressDuration: NodeJS.Timeout;
  };

  constructor(parameters: LeaksMacrosParameters) {
    const settings = LeaksMacros.parseSettings(parameters.settings, parameters.version);
    const state = LeaksMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.LEAKS,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, createDefaultState()),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.output = {
      switch: [],
      enum: [],
      analog: [],
      phase: [],
    };

    this.timer = {
      controlProgressDuration: setInterval(this.controlProgressDuration, 1000),
    };

    this.checkPhaseCombination();
  }

  private checkPhaseCombination = () => {
    for (const phase of this.settings.devices.phase) {
      const open = this.controls.get(getControlId(phase.open));
      const close = this.controls.get(getControlId(phase.close ?? { deviceId: '', controlId: '' }));
      const power = this.controls.get(getControlId(phase.power ?? { deviceId: '', controlId: '' }));
      const isOpen = this.controls.get(getControlId(phase.isOpen ?? { deviceId: '', controlId: '' }));
      const isClose = this.controls.get(getControlId(phase.isClose ?? { deviceId: '', controlId: '' }));

      let hasError = false;

      /**
       * Проверка линий управления.
       */
      if (!open) {
        logger.error('The valve opening phase was not found 🚨');

        hasError = true;
      }

      if (open && !close && !power) {
        logger.error('No phases were found for  supplying power 🚨');

        hasError = true;
      }

      if (open && close && power) {
        logger.info('An erroneous configuration is selected, it is not clear which control method is selected 🚨');

        hasError = true;
      }

      /**
       * Проверка наличия сигнальных линий.
       */
      if (!isOpen || !isClose) {
        logger.error(
          'The position control method via signals is selected, but controls for both positions are not selected 🚨',
        );

        hasError = true;
      }

      if (hasError) {
        logger.error({
          name: this.name,
          now: this.now,
          phase,
          open: Boolean(open),
          close: Boolean(close),
          power: Boolean(power),
          isOpen: Boolean(isOpen),
          isClose: Boolean(isClose),
        });

        this.destroy();

        throw new Error('Unable to start leaks macros');
      }
    }
  };

  static parseSettings = (settings: string, version: number = VERSION): LeaksMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): LeaksMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): LeaksMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    /**
     * TODO Передать схему, только для публичного стейта
     */
    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicStateJson: string): void => {
    const nextPublicState = LeaksMacros.parsePublicState(nextPublicStateJson, this.version);

    logger.info('The next public state was appeared ⏭️');

    if (this.state.force !== nextPublicState.force) {
      if (nextPublicState.force === 'UNSPECIFIED') {
        logger.info('Forced behavior is disabled 🆓');
      }

      if (nextPublicState.force === 'OPEN') {
        logger.info('Forced behavior is open 💧');
      }

      if (nextPublicState.force === 'CLOSE') {
        logger.info('Forced behavior is close 🌵');
      }

      logger.debug({
        name: this.name,
        now: this.now,
        nextPublicState,
        state: this.state,
      });

      this.state.force = nextPublicState.force;

      this.execute();
    }
  };

  private getDebugContext = (mixin = {}) => {
    return {
      name: this.name,
      now: this.now,
      ...mixin,
      state: this.state,
      phase: this.phase,
      isSwitchOpen: this.isSwitchOpen,
      isSwitchClose: this.isSwitchClose,
      isEnumOpen: this.isEnumOpen,
      isEnumClose: this.isEnumClose,
      isAnalogOpen: this.isAnalogOpen,
      isAnalogClose: this.isAnalogClose,
      isPhaseOpen: this.isPhaseOpen,
      isPhaseOnWay: this.isPhaseOnWay,
      isPhaseClose: this.isPhaseClose,
      output: this.output,
    };
  };

  protected collecting() {
    this.collectLeaks();
  }

  private collectLeaks() {
    const { leaks } = this.settings.devices;

    const { leak } = this.settings.properties;

    const nextLeak = leaks.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === leak.switch || control.value === leak.enum;
      }

      return false;
    });

    if (this.state.leak !== nextLeak) {
      if (nextLeak) {
        logger.info('A leak has been detected 💧 🐬');
      } else {
        logger.info('The leak has been fixed 🌵 🍸');
      }

      logger.debug(this.getDebugContext({ nextLeak }));

      this.state.leak = nextLeak;
    }
  }

  private get isSwitchOpen(): boolean {
    return this.settings.devices.switch.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === control.on;
      }

      return false;
    });
  }

  private get isSwitchClose(): boolean {
    return this.settings.devices.switch.every((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === control.off;
      }

      return false;
    });
  }

  private get isEnumOpen(): boolean {
    return this.settings.devices.enum.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.enum.open;
      }

      return false;
    });
  }

  private get isEnumClose(): boolean {
    return this.settings.devices.enum.every((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.enum.close;
      }

      return false;
    });
  }

  private get isAnalogOpen(): boolean {
    return this.settings.devices.analog.some((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.analog.open;
      }

      return false;
    });
  }

  private get isAnalogClose(): boolean {
    return this.settings.devices.analog.every((device) => {
      const control = this.controls.get(getControlId(device));

      if (control) {
        return control.value === this.settings.properties.analog.close;
      }

      return false;
    });
  }

  private get isPhaseOpen(): boolean {
    return this.settings.devices.phase.some((devices) => {
      const open = this.controls.get(getControlId(devices.open));
      const close = this.controls.get(getControlId(devices.close ?? { deviceId: '', controlId: '' }));
      const power = this.controls.get(getControlId(devices.power ?? { deviceId: '', controlId: '' }));
      const isOpen = this.controls.get(getControlId(devices.isOpen ?? { deviceId: '', controlId: '' }));
      const isClose = this.controls.get(getControlId(devices.isClose ?? { deviceId: '', controlId: '' }));

      if (isOpen && isClose) {
        /**
         * Управление через реле + сигнальные линии.
         */

        return isOpen.value === isOpen.on && isClose.value === isClose.off;
      } else if (open && close && !power) {
        /**
         * Управление при помощи двух реле, и временной задержки на переключение крана.
         */

        return this.state.valve === ValueState.OPEN && open.value === open.off && close.value === close.off;
      } else if (open && !close && power) {
        /**
         * Управление при переключающегося реле и реле подключения питания, и временной задержки на переключение крана.
         */

        return this.state.valve === ValueState.OPEN && open.value === open.off && power.value === power.off;
      }

      return false;
    });
  }

  private get isPhaseOnWay(): boolean {
    return this.settings.devices.phase.some((devices) => {
      const open = this.controls.get(getControlId(devices.open));
      const close = this.controls.get(getControlId(devices.close ?? { deviceId: '', controlId: '' }));
      const power = this.controls.get(getControlId(devices.power ?? { deviceId: '', controlId: '' }));
      const isOpen = this.controls.get(getControlId(devices.isOpen ?? { deviceId: '', controlId: '' }));
      const isClose = this.controls.get(getControlId(devices.isClose ?? { deviceId: '', controlId: '' }));

      if (isOpen && isClose) {
        /**
         * Управление через реле + сигнальные линии.
         */

        return isOpen.value === isOpen.off && isClose.value === isClose.off;
      } else if (open && close && !power) {
        /**
         * Управление при помощи двух реле, и временной задержки на
         * переключение крана.
         */

        return open.value !== open.off || close.value !== close.off;
      } else if (open && !close && power) {
        /**
         * Управление через переключающееся реле и реле подключения питания, и
         * временной задержки на переключение крана.
         */

        return open.value !== open.off || power.value === power.on;
      }

      return false;
    });
  }

  private get isPhaseClose(): boolean {
    return this.settings.devices.phase.some((devices) => {
      const open = this.controls.get(getControlId(devices.open));
      const close = this.controls.get(getControlId(devices.close ?? { deviceId: '', controlId: '' }));
      const power = this.controls.get(getControlId(devices.power ?? { deviceId: '', controlId: '' }));
      const isOpen = this.controls.get(getControlId(devices.isOpen ?? { deviceId: '', controlId: '' }));
      const isClose = this.controls.get(getControlId(devices.isClose ?? { deviceId: '', controlId: '' }));

      if (isOpen && isClose) {
        /**
         * Управление через реле + сигнальные линии.
         */

        return isOpen.value === isOpen.off && isClose.value === isClose.on;
      } else if (open && close && !power) {
        /**
         * Управление при помощи двух реле, и временной задержки на переключение
         * крана.
         */

        return this.state.valve === ValueState.CLOSE && open.value === open.off && close.value === close.off;
      } else if (open && !close && power) {
        /**
         * Управление при переключающегося реле и реле подключения питания,
         * и временной задержки на переключение крана.
         */

        return this.state.valve === ValueState.CLOSE && open.value === open.off && power.value === power.off;
      }

      return false;
    });
  }

  /**
   * Задается на уровне FE приложения.
   */
  protected priorityComputation = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      if (this.state.force === 'OPEN' && this.state.valve === ValueState.CLOSE) {
        logger.info('The valves will be forcibly closed 🌵');

        this.state.valve = ValueState.OPEN;

        logger.info('The duration of activation on the phases is set ⏱️ 🎯 💾');

        this.phase.durationOfActivation = addSeconds(new Date(), this.settings.properties.phase.durationSec);

        logger.debug(this.getDebugContext());

        this.computeOutput();
        this.send();
      }

      if (this.state.force === 'CLOSE' && this.state.valve === ValueState.OPEN) {
        logger.info('The valves will be forcibly open 💧');

        this.state.valve = ValueState.CLOSE;

        logger.info('The duration of activation on the phases is set ⏱️ 🎯 💾');

        this.phase.durationOfActivation = addSeconds(new Date(), this.settings.properties.phase.durationSec);

        logger.debug(this.getDebugContext());

        this.computeOutput();
        this.send();
      }

      return true;
    }

    return false;
  };

  /**
   * У нас нет непосредственных элементов управления.
   */
  protected actionBasedComputing = (): boolean => {
    return false;
  };

  protected sensorBasedComputing = (): boolean => {
    let nextValve = this.state.valve;

    if (this.state.leak && this.state.valve === ValueState.OPEN) {
      logger.info('The valves will be closed 🏜️ 🌵');

      nextValve = ValueState.CLOSE;
    }

    if (!this.state.leak && this.state.valve === ValueState.CLOSE) {
      logger.info('The valves will be opened 🌊 💧');

      nextValve = ValueState.OPEN;
    }

    if (this.state.valve !== nextValve) {
      logger.info('The condition of the valve has been changed 🎲 🎯 💾');

      this.state.valve = nextValve;

      logger.info('The duration of activation on the phases is set ⏱️ 🎯 💾');

      this.phase.durationOfActivation = addSeconds(new Date(), this.settings.properties.phase.durationSec);

      logger.debug(this.getDebugContext());

      this.computeOutput();
      this.send();
    }

    return false;
  };

  private controlProgressDuration = () => {
    const valveOnWay = compareAsc(new Date(), this.phase.durationOfActivation) === -1;

    if (this.isPhaseOnWay && !valveOnWay) {
      logger.info('The time for activating on the phases has expired ⏰');

      this.computePhaseOutput(true);

      logger.debug(this.getDebugContext());

      this.send();
    }
  };

  protected computeOutput = () => {
    this.output = {
      switch: [],
      enum: [],
      analog: [],
      phase: [],
    };

    for (const device of this.settings.devices.switch) {
      const controlType = ControlType.SWITCH;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The switch control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          device,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      let value = control.off;

      if (this.state.valve === ValueState.OPEN) {
        value = control.on;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = control.off;
      }

      if (String(control.value) !== String(value)) {
        this.output.switch.push({ ...device, value });
      }
    }

    for (const device of this.settings.devices.enum) {
      const controlType = ControlType.SWITCH;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The enum control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          device,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      let value = this.settings.properties.enum.close;

      if (this.state.valve === ValueState.OPEN) {
        value = this.settings.properties.enum.open;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = this.settings.properties.enum.close;
      }

      if (String(control.value) !== String(value)) {
        this.output.enum.push({ ...device, value });
      }
    }

    for (const device of this.settings.devices.analog) {
      const controlType = ControlType.RANGE;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The range control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          device,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      let value = this.settings.properties.analog.close;

      if (this.state.valve === ValueState.OPEN) {
        value = this.settings.properties.analog.open;
      }

      if (this.state.valve === ValueState.CLOSE) {
        value = this.settings.properties.analog.close;
      }

      if (String(control.value) !== String(value)) {
        this.output.analog.push({ ...device, value });
      }
    }

    this.computePhaseOutput();

    logger.info('The output was computed 🍋 🧪 ✊🏻');
    logger.debug(this.getDebugContext());
  };

  private computePhaseOutput = (forceOff = false) => {
    this.output.phase = [];

    for (const devices of this.settings.devices.phase) {
      const controlType = ControlType.SWITCH;

      const open = this.controls.get(getControlId(devices.open));
      const close = this.controls.get(getControlId(devices.close ?? { deviceId: '', controlId: '' }));
      const power = this.controls.get(getControlId(devices.power ?? { deviceId: '', controlId: '' }));

      if (!open || open.type !== controlType || !open.topic.write) {
        logger.error('The open control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          devices,
          controlType,
          open,
          controls: this.controls.size,
        });

        continue;
      }

      if (!close || close.type !== controlType || !close.topic.write) {
        logger.error('The close control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          devices,
          controlType,
          close,
          controls: this.controls.size,
        });

        continue;
      }

      if (power && (power.type !== controlType || !power.topic.write)) {
        logger.error('The power control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          devices,
          controlType,
          power,
          controls: this.controls.size,
        });

        continue;
      }

      /**
       * Управление через два отдельных реле.
       */
      if (open && close && devices.close && !power) {
        if (forceOff && (open.value === open.on || close.value === close.on)) {
          this.output.phase.push({
            ...(open.value === open.on
              ? {
                  open: {
                    ...devices.open,
                    delaySec: 0,
                    value: open.off,
                  },
                }
              : {}),
            ...(close.value === close.on
              ? {
                  close: {
                    ...devices.close,
                    delaySec: 0,
                    value: close.off,
                  },
                }
              : {}),
          });

          continue;
        }

        if (this.isPhaseOnWay) {
          logger.info('Skipping the command for phase control, as the valve is in the process 👩‍🔬');
          logger.debug(this.getDebugContext({ devices }));

          continue;
        }

        if (this.state.valve === ValueState.OPEN && open.value === open.off) {
          this.output.phase.push({
            open: {
              ...devices.open,
              delaySec: close.value === close.on ? 1 : 0,
              value: open.on,
            },
            ...(close.value === close.on
              ? {
                  close: {
                    ...devices.close,
                    delaySec: 0,
                    value: close.off,
                  },
                }
              : {}),
          });
        }

        if (this.state.valve === ValueState.CLOSE && close.value === close.off) {
          this.output.phase.push({
            ...(open.value === open.on
              ? {
                  open: {
                    ...devices.open,
                    delaySec: 0,
                    value: open.off,
                  },
                }
              : {}),
            close: {
              ...devices.close,
              delaySec: open.value === open.on ? 1 : 0,
              value: close.on,
            },
          });
        }
      }

      /**
       * Управление через NO/NC + Power комплект реле.
       */
      if (open && !close && power && devices.power) {
        if (forceOff && (open.value === open.on || power.value === power.on)) {
          this.output.phase.push({
            ...(open.value === open.on
              ? {
                  open: {
                    ...devices.open,
                    delaySec: 0,
                    value: open.off,
                  },
                }
              : {}),
            ...(power.value === power.on
              ? {
                  power: {
                    ...devices.power,
                    delaySec: 0,
                    value: power.off,
                  },
                }
              : {}),
          });

          continue;
        }

        if (this.isPhaseOnWay) {
          logger.info('Skipping the command for phase control, as the valve is in the process 👩‍🔬');
          logger.debug(this.getDebugContext({ devices }));

          continue;
        }

        if (this.state.valve === ValueState.OPEN) {
          this.output.phase.push(
            {
              open: {
                ...devices.open,
                delaySec: 1,
                value: open.on,
              },
              power: {
                ...devices.power,
                delaySec: 0,
                value: power.off,
              },
            },
            {
              power: {
                ...devices.power,
                delaySec: 2,
                value: power.on,
              },
            },
          );
        }

        if (this.state.valve === ValueState.CLOSE) {
          this.output.phase.push(
            {
              open: {
                ...devices.open,
                delaySec: 1,
                value: open.off,
              },
              power: {
                ...devices.power,
                delaySec: 0,
                value: power.off,
              },
            },
            {
              power: {
                ...devices.power,
                delaySec: 2,
                value: power.on,
              },
            },
          );
        }
      }
    }
  };

  protected send = async () => {
    for (const device of this.output.switch) {
      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.write;
      const message = device.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(this.getDebugContext({ device }));

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    for (const device of this.output.enum) {
      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.write;
      const message = device.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(this.getDebugContext({ device }));

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    for (const device of this.output.analog) {
      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.write;
      const message = device.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(this.getDebugContext({ device }));

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    let phase: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
      readonly delaySec: number;
      readonly value: string;
    }> = [];

    for (const { open, close, power } of this.output.phase) {
      if (open) {
        phase.push(open);
      }

      if (close) {
        phase.push(close);
      }

      if (power) {
        phase.push(power);
      }
    }

    phase = phase.sort((a, b) => {
      return a.delaySec < b.delaySec ? -1 : 1;
    });

    for (const device of phase) {
      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.write;
      const message = device.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error(this.getDebugContext({ device }));

        continue;
      }

      if (device.delaySec > 0) {
        logger.info('Waiting before sending a message ⏳');
        logger.debug({
          name: this.name,
          now: this.now,
          device,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, device.delaySec * 1000));

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        device,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }
  };

  protected destroy() {
    clearInterval(this.timer.controlProgressDuration);
  }
}

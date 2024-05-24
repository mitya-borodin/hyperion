/* eslint-disable unicorn/prefer-ternary */
/* eslint-disable for-direction */
/* eslint-disable prefer-const */
/* eslint-disable unicorn/no-array-reduce */
import { addMinutes, addSeconds, compareAsc, compareDesc, format, subMinutes } from 'date-fns';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';
import throttle from 'lodash.throttle';

import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { getLogger } from '../../../infrastructure/logger';
import { ControlType } from '../../control-type';
import { HyperionDevice } from '../../hyperion-device';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = getLogger('hyperion:macros:curtain');

/**
 * TODO Добавить блокировку открывания, по датчиком открытия окна.
 */

/**
 * ! SETTINGS
 */

/**
 * Тип переключателя (кнопка, геркон).
 *
 * От типа зависит приоритет у кнопки максимальный приоритет, после идет геркон.
 *
 * Для геркона уже будут проверяться имеющиеся блокировки действий.
 */
export enum SwitchType {
  BUTTON = 'BUTTON',
  SEALED_CONTACT = 'SEALED_CONTACT',
  RELAY = 'RELAY',
}

/**
 * Определяет по верхнему ("1", +5, true) или по нижнему ("0", 0, false) уровню случится реакция.
 * Значение по умолчанию DOWN.
 */
export enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum Lighting {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Правило определения числового значения по нескольким датчикам
 * MAX - берем максимальное среди всех
 * MIN - берем минимальное среди всех
 * AVG - берем среднее среди всех
 */
export enum LevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

/**
 * Направление движения крышки.
 */
export enum OpenCloseByTimeDirection {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
}

/**
 * Типы блокировок.
 */
export enum BlockType {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  ALL = 'ALL',
}

/**
 * ! Cover macros scenarios
 *
 * В описание роль крышки будет играть штора, но вместо шторы могут быть любые другие
 *  устройства типа Cover https://www.zigbee2mqtt.io/guide/usage/exposes.html#specific
 *
 * Шторы управляются при помощи:
 *  Кнопок
 *  Виртуальная кнопка (дает возможность управлять через приложение)
 *  Герконов
 *  Освещенности
 *  Движения
 *  Шума
 *  Температуре
 *  Времени
 *
 * * 1. Блокировка действий по времени
 *
 * Позволяет заблокировать изменение состояния шторы в заданном временном диапазоне.
 *
 * Возможно указать какое именно действие блокировать:
 * [
 *  {type: "OPEN", fromMin: 23 * 60, toMin: 9 * 60 },
 *  {type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 },
 *  {type: "ANY", fromMin: 21 * 60, toMin: 22 * 60 }
 * ]
 *
 * Это полезно когда нужно приостановить выполнение автоматических функций.
 *
 * В случае когда мы не хотим открывать штору с ночи до определенно времени дня например гарантированно до
 * 10 дня, мы зададим [{type: "OPEN", fromMin: 0 * 60, toMin: 10 * 60 }].
 *
 * В случае когда мы гарантированно не хотим закрывать шторы в середине дня, мы зададим
 * [{type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 }].
 *
 * В случае когда мы хотим запретить все автоматические действия, скажем перед сном
 * [{type: "ANY", fromMin: 20 * 60, toMin: 23 * 60 }].
 *
 * В результате мы получим настройку
 * [
 *  {type: "OPEN", fromMin: 0 * 60, toMin: 10 * 60 },
 *  {type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 },
 *  {type: "ANY", fromMin: 20 * 60, toMin: 23 * 60 }
 * ]
 *
 * Это базовая настройка, задается для:
 * - Предотвращения не нужных переключений утром и ночью.
 * - Для обеспечения достаточного времени инсоляции.
 *
 * * 2. Открыть/Остановить/Закрыть через кнопку либо через реальную либо через виртуальную.
 * Классический способ переключать состояние шторы, при котором нужно нажимать на кнопку.
 *
 * Способ является приоритетным над всеми остальными, и может выставлять блокировку
 * на изменения состояния, на заданное время.
 *
 * То есть в случае открывания/закрывания кнопкой, штора в любом случае изменит состояние,
 *  и автоматические действия будут заблокированы на время указанное в настройках.
 *
 * Чтобы реализовать функциональность открыть/закрыть все шторы, нужно сделать экземпляр
 *  макроса, куда добавить одну виртуальную кнопу и все шторы.
 *
 * Нажимая на неё через приложение, все шторы будут получать команды.
 *
 * * 3. Открыть по геркону
 * Позволяет начать открывать шторы при отрывании двери.
 *
 * Открывание шторы блокируется датчиком освещенности.
 *
 * * 4. Открыть/Закрыть по времени
 * Позволяет указать в какой час нужно изменить состояние шторы.
 *
 * {
 *   direction: "OPEN",
 *   blockMin: 2 * 60,
 *   timePointMin: [1 * 60,4 * 60,6 * 60,8 * 60]
 * }
 * Штора будет пытаться открыться в 1, 4, 6, 8 часов
 * и после каждой попытки будут блокироваться автоматические
 * действия на заданное время.
 *
 * {
 *  direction: "CLOSE",
 *  blockMin: 8 * 60,
 *  timePointMin: [18 * 60,20 * 60,0 * 60]
 * }
 * Штора будет пытаться закрыться в 18, 20, 0, часов
 * и после каждой попытки будут блокироваться автоматические
 * действия на заданное время.
 *
 * При пересечении времени, приоритет будет отдан операции CLOSE.
 *
 * * 5. Открыть/Закрыть по освещенности
 * Позволяет закрывать штору при наступлении ночи и в излишне солнечный день,
 * и открывать при наступлении для и уменьшении солнечной активности.
 *
 * * 6. Движение и шум
 * Блокирует открывание по освещенности, в случае полной тишины.
 *
 * Дополнительные данные, позволяют определять полную тишину.
 *
 * При нарушении тишины и достаточной освещенности, штора откроется.
 *
 * * 7. Закрыть по солнечной активности
 * Позволяет закрыть штору, если освещенность, температура
 * выше уставок и установилась полная тишина.
 */
export type CurtainMacrosSettings = {
  readonly devices: {
    readonly switchers: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    readonly buttons: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ENUM;
    }>;

    readonly lightings: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;

    readonly illuminations: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ILLUMINATION;
    }>;

    readonly motions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;

    readonly noises: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SOUND_LEVEL;
    }>;

    readonly temperatures: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.TEMPERATURE;
    }>;

    /**
     * Контрол переключения состояния шторы.
     */
    readonly states: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ENUM;
    }>;

    /**
     * Контрол позволяет увидеть положение шторы после окончания
     * движения, и задать то положение в которое должна прийти штора.
     */
    readonly positions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;
  };

  readonly properties: {
    /**
     * * 1. Блокировка действий по времени
     *
     * Позволяет заблокировать изменение состояния шторы в заданном
     * временном диапазоне.
     *
     * Возможно указать какое именно действие блокировать:
     * [
     *  {type: "OPEN", fromMin: 23 * 60, toMin: 9 * 60 },
     *  {type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 },
     *  {type: "ANY", fromMin: 21 * 60, toMin: 22 * 60 }
     * ]
     *
     * Это полезно когда нужно приостановить выполнение автоматических
     * функций.
     *
     * В случае когда мы не хотим открывать штору с ночи до определенно
     * времени дня например гарантированно до 10 дня, мы зададим
     * [{type: "OPEN", fromMin: 0 * 60, toMin: 10 * 60 }].
     *
     * В случае когда мы гарантированно не хотим закрывать шторы в середине
     * дня, мы зададим
     * [{type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 }].
     *
     * В случае когда мы хотим запретить все автоматические действия,
     * скажем перед сном
     * [{type: "ANY", fromMin: 20 * 60, toMin: 23 * 60 }].
     *
     * В результате мы получим настройку
     * [
     *  {type: "OPEN", fromMin: 0 * 60, toMin: 10 * 60 },
     *  {type: "CLOSE", fromMin: 11 * 60, toMin: 16 * 60 },
     *  {type: "ANY", fromMin: 20 * 60, toMin: 23 * 60 }
     * ]
     *
     * Это базовая настройка, задается для:
     * - Предотвращения не нужных переключений утром и ночью.
     * - Для обеспечения достаточного времени инсоляции.
     */
    readonly blocks: Array<{ type: BlockType; fromMin: number; toMin: number }>;

    /**
     * * 2. Открыть/Остановить/Закрыть через кнопку либо через реальную
     * * либо через виртуальную.
     * Классический способ переключать состояние шторы, при котором нужно
     * нажимать на кнопку.
     *
     * Способ является приоритетным над всеми остальными, и может
     * выставлять блокировку на изменения состояния, на заданное время.
     *
     * То есть в случае открывания/закрывания кнопкой, штора в любом
     * случае изменит состояние, и автоматические действия будут
     * заблокированы на время указанное в настройках.
     *
     * Чтобы реализовать функциональность открыть/закрыть все шторы,
     * нужно сделать экземпляр макроса, куда добавить одну
     * виртуальную кнопу и все шторы.
     *
     * Нажимая на неё через приложение, все шторы будут получать команды.
     *
     * * 3. Открыть по геркону
     * Позволяет начать открывать шторы при отрывании двери.
     *
     * Открывание шторы блокируется датчиком освещенности.
     */
    readonly switcher: {
      /**
       * Позволяет указать, на какое состояние переключателя реагировать, верхнее или нижнее.
       */
      readonly trigger: Trigger;

      /**
       * Позволяет разделить приоритет на типы переключателей.
       */
      readonly type: SwitchType;

      /**
       * Позволяет заблокировать все автоматические действия на заданное время.
       *
       * Если указать 0 минут, то блокировка не включится.
       */
      readonly blockMin: number;
    };

    /**
     * * 4. Открыть/Закрыть по времени
     * Позволяет указать в какой час нужно изменить состояние шторы.
     *
     * {
     *   direction: "OPEN",
     *   blockMin: 2 * 60,
     *   timePointMin: [1 * 60,4 * 60,6 * 60,8 * 60]
     * }
     * Штора будет пытаться открыться в 1, 4, 6, 8 часов
     * и после каждой попытки будут блокироваться автоматические
     * действия на заданное время.
     *
     * {
     *  direction: "CLOSE",
     *  blockMin: 8 * 60,
     *  timePointMin: [18 * 60,20 * 60,0 * 60]
     * }
     * Штора будет пытаться закрыться в 18, 20, 0, часов
     * и после каждой попытки будут блокироваться автоматические
     * действия на заданное время.
     *
     * При пересечении времени, приоритет будет отдан операции CLOSE.
     */
    readonly openCloseByTime: Array<{
      direction: OpenCloseByTimeDirection;
      blockMin: number;
      timePointMin: number[];
    }>;

    /**
     * * 5. Открыть/Закрыть по освещенности
     * Позволяет закрывать штору при наступлении ночи и в излишне солнечный день.
     */
    readonly illumination: {
      readonly detection: LevelDetection;

      /**
       * Позволяет определить день или ночь.
       */
      readonly low: {
        /**
         * Если значение меньше closeLux штора закрывается.
         * Значение рассматривается только при открытой шторе.
         */
        closeLux: number;
        /**
         * Если значение больше openLux штора откроется при появлении движения.
         * Значение рассматривается только при закрытой шторе.
         */
        openLux: number;
      };

      /**
       * Позволяет определить излишне солнечный день или нет.
       */
      readonly hi: {
        /**
         * Если значение больше closeLux штора закроется.
         * Значение рассматривается только при открытой шторе.
         */
        closeLux: number;
        /**
         * Если значение меньше openLux штора откроется.
         * Значение рассматривается только при закрытой шторе.
         */
        openLux: number;
      };
    };

    /**
     * * 6. Движение и шум
     * Блокирует открывание по освещенности, в случае полной тишины.
     *
     * Дополнительные данные, позволяют определять полную тишину.
     *
     * При нарушении тишины и достаточной освещенности, штора откроется.
     */
    readonly motion: {
      readonly detection: LevelDetection;

      /**
       * Задает чувствительность к движению.
       */
      readonly trigger: number;
    };

    readonly noise: {
      readonly detection: LevelDetection;

      /**
       * Задает чувствительность к шуму.
       */
      readonly trigger: number;
    };

    /**
     * Определение полной тишины.
     *
     * Значение задается в минутах.
     *
     * Если > 0, то в случае отсутствия шума и движения
     * устанавливается полная тишина.
     *
     * Если указать <= 0, то полная тишина устанавливаться не будет.
     */
    readonly silenceMin: number;

    readonly temperature: {
      readonly detection: LevelDetection;
    };

    /**
     * * 7. Закрыть по солнечной активности
     * Позволяет закрыть штору, если освещенность и температура выше уставок.
     */
    readonly closeBySun: {
      readonly illumination: {
        /**
         * Если освещенность больше closeLux и температура больше temperature
         * штора закрывается.
         *
         * Значение рассматривается только при открытой шторе.
         */
        closeLux: number;

        /**
         * Если освещенность меньше openLux штора закрывается.
         *
         * Значение рассматривается только при закрытой шторе.
         */
        openLux: number;
      };
      readonly temperature: number;
    };

    readonly state: {
      /**
       * Выбирается пользователем из enum который предоставляет устройство.
       */
      readonly stop: string;
    };

    readonly position: {
      /**
       * Значение при полностью открытом положении
       */
      readonly open: number;

      /**
       * Значение при полностью закрытом положении
       */
      readonly close: number;
    };
  };
};

/**
 * ! STATE
 */
export type CurtainMacrosPublicState = {
  /**
   * Положение шторы, от 0 до 100.
   *
   * По умолчанию 100 - открыто, 0 - закрыто.
   *
   * Реверс настраивается на самом устройстве, а так же можно
   * выполнить реверс через настройки, путем указания параметров
   * CurtainMacrosSettings.position.open и
   * CurtainMacrosSettings.position.close
   *
   * Возможно для каждой шторы задать значение открытого и
   * закрытого положения, исходя из этого макросу будет понятно, в
   * каком направлении двигать штору.
   *
   * Нужно иметь в виду, что при подключении привода, ему нужно
   * указать где начало и где границы открывания/закрывания, а так
   * же направление, и желательно задавать значение по умолчанию.
   */
  target: number;
};

type CurtainMacrosPrivateState = {
  position: number;
  /**
   * Хранит последнее направление движения шторы.
   */
  direction: 'UNSPECIFIED' | 'OPEN' | 'CLOSE';
  /**
   * Если true, то последнее сообщение было STOP.
   */
  stop: boolean;
  lighting: Lighting;
  illumination: {
    measured: number;
    average: number;
    /**
     * Знание о том, какой уровень освещенности был до включения освещения полезен,
     * для того, чтобы не "задирать" скользящую среднюю.
     */
    beforeTurningOnLighting: number;
    descent: number;
  };
  motion: number;
  noise: number;
  temperature: number;
};

type CurtainMacrosState = CurtainMacrosPublicState & CurtainMacrosPrivateState;

/**
 * ! OUTPUT
 */
/**
 * В результате макрос решает, каким способом по влиять на крышку
 * указать положение через position, либо задать state чтобы контроллер крышки
 * сделал всю работу, и полностью открыл, закрыл, остановил крышку.
 */
type CurtainMacrosOutput = {
  states: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.ENUM;
    readonly value: string;
  }>;
  positions: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
    readonly value: number;
  }>;
};

const VERSION = 0;

type CurtainMacrosParameters = MacrosParameters<string, string | undefined>;

const defaultState: CurtainMacrosState = {
  target: -1,
  position: -1,
  direction: 'UNSPECIFIED',
  stop: false,
  lighting: Lighting.OFF,
  illumination: {
    measured: -1,
    average: -1,
    beforeTurningOnLighting: 0,
    descent: -1,
  },
  motion: -1,
  noise: -1,
  temperature: -1,
};

const createDefaultState = () => {
  return cloneDeep(defaultState);
};

export class CurtainMacros extends Macros<MacrosType.COVER, CurtainMacrosSettings, CurtainMacrosState> {
  private output: CurtainMacrosOutput;

  private last = {
    motion: subMinutes(new Date(), 60),
    noise: subMinutes(new Date(), 60),
  };

  private block = {
    open: new Date(),
    close: new Date(),
    all: new Date(),
  };

  private skip = {
    /**
     * Кнопки работающие через enum, эмитят события с одним и тем же значением действия,
     * и мы не можем понять изменилось ли оно с прошлого нажатия, это приводит к тому,
     * что при старте макроса загруженные данные воспринимаются как нажатая кнопка,
     * чтобы этого избежать, мы пропускаем обработку первого нажатия.
     *
     * Даже если в БД нет данных по кнопке, пользователь в первый раз после запуска
     * макроса один раз в холостую нажмет, это не страшно.
     */
    firstButtonChange: [] as Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ENUM;
    }>,
  };

  private timer: {
    timeBasedComputing: NodeJS.Timeout;
    illuminationMovingArrange: NodeJS.Timeout;
  };

  constructor(parameters: CurtainMacrosParameters) {
    const settings = CurtainMacros.parseSettings(parameters.settings, parameters.version);
    const state = CurtainMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.COVER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, createDefaultState()),

      devices: parameters.devices,
      controls: parameters.controls,

      collectingThrottleMs: 500,
      sensorBasedComputingThrottleMs: 10_000,
    });

    this.output = {
      states: [],
      positions: [],
    };

    this.timer = {
      timeBasedComputing: setInterval(this.timeBasedComputing, 60 * 1000),
      illuminationMovingArrange: setInterval(() => this.computeMovingArrange('illumination'), 60 * 1000),
    };

    this.skip.firstButtonChange = cloneDeep(this.settings.devices.buttons);

    this.retryToApplyNextState = throttle(this.retryToApplyNextState, 60 * 1000);

    this.showSate = throttle(this.showSate, 60 * 1000);
    this.showSensorContext = throttle(this.showSensorContext, 60 * 1000);
  }

  /**
   * Высокочастотные логи.
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showSate = () => {
    logger.info('The calculation 💻 of the state 🇺🇸 is completed ✅');
    logger.debug({
      name: this.name,
      now: this.now,
      state: this.state,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showSensorContext = (context: any) => {
    logger.info('The context of sensor 📡 based computing 💻');
    logger.debug(context);
  };

  /**
   * Изменение состояния.
   */
  static parseSettings = (settings: string, version: number = VERSION): CurtainMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): CurtainMacrosState => {
    if (!state) {
      return createDefaultState();
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  static parsePublicState = (state?: string, version: number = VERSION): CurtainMacrosPublicState => {
    if (!state) {
      return createDefaultState();
    }

    /**
     * TODO Передать схему, только для публичного стейта
     */
    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextStateJson: string): void => {
    const nextState = CurtainMacros.parsePublicState(nextStateJson, this.version);

    logger.info('The next public state was supplied 📥');
    logger.debug({
      name: this.name,
      now: this.now,
      nextState,
      state: this.state,
    });

    if (this.state.target === nextState.target) {
      logger.warning('The received state does not differ from the current one 🚨');
    } else {
      this.state.target = nextState.target;
      this.state.direction = this.getDirection();

      logger.info('The next state was applied 🫒 by set state in manual mode 🚹');
      logger.debug({ state: this.state });

      this.computeOutput();
      this.send();
    }
  };

  private setTarget(nextTarget: number) {
    if (this.state.target !== nextTarget) {
      this.state.target = nextTarget;
      this.state.direction = this.getDirection();

      logger.info('The next target 🎯 position was set ✅');
      logger.debug({
        name: this.name,
        now: this.now,
        position: this.settings.properties.position,
        state: this.state,
      });

      this.computeOutput();
      this.send();
    }
  }

  /**
   * Проверка наличия блокировок.
   */
  private isBlocked = (target: number): boolean => {
    if (this.hasAllBlock) {
      return true;
    }

    const { blocks, position } = this.settings.properties;

    const direction = this.getDirection(target);

    const hasBlockByTimeRange = blocks.some(({ type, fromMin, toMin }) => {
      if (this.hasHourOverlap(fromMin, toMin, 'min')) {
        if ((direction === 'OPEN' || target === position.open) && (type === BlockType.OPEN || type === BlockType.ALL)) {
          return true;
        }

        if (
          (direction === 'CLOSE' || target === position.close) &&
          (type === BlockType.CLOSE || type === BlockType.ALL)
        ) {
          return true;
        }
      }

      return false;
    });

    if (hasBlockByTimeRange) {
      logger.info('Position change is blocked 🚫 by time range ⏱️');
      logger.debug({ name: this.name, now: this.now, direction, target, blocks });

      return true;
    }

    if ((direction === 'OPEN' || target === position.open) && this.hasOpenBlock) {
      logger.info('The opening is blocked 🚫 until the set time ⏱️');
      logger.debug({
        name: this.name,
        now: this.now,
        direction,
        target,
        hasOpenBlock: this.hasOpenBlock,
        block: this.block,
      });

      return true;
    }

    if ((direction === 'CLOSE' || target === position.close) && this.hasCloseBlock) {
      logger.info('The close is blocked 🚫 until the set time ⏱️');
      logger.debug({
        name: this.name,
        now: this.now,
        direction,
        target,
        hasCloseBlock: this.hasCloseBlock,
        block: this.block,
      });

      return true;
    }

    return false;
  };

  /**
   * Автоматизация по времени.
   */
  private timeBasedComputing = () => {
    let toClose = false;
    let toOpen = false;
    let blockMin = 0;
    let timePointIsHit = false;

    /**
     * ! Реализация приоритета закрывания.
     */
    const openCloseByTime = this.settings.properties.openCloseByTime.sort((a, b) => {
      if (a.direction === OpenCloseByTimeDirection.CLOSE) {
        return 1;
      }

      if (b.direction === OpenCloseByTimeDirection.OPEN) {
        return -1;
      }

      return 0;
    });

    logger.info('The timeBasedComputing was run ⏰ 🏌️‍♂️ 🏃‍♀️‍➡️ ⏯️');
    logger.debug({
      name: this.name,
      now: this.now,
      openCloseByTime,
      state: this.state,
    });

    for (const { direction, blockMin: block, timePointMin } of openCloseByTime) {
      if (toClose || toOpen) {
        break;
      }

      for (const min of timePointMin) {
        timePointIsHit = this.hitTimeRange(min);

        if (timePointIsHit) {
          blockMin = block;

          if (direction === OpenCloseByTimeDirection.CLOSE) {
            toClose = true;
          }

          if (direction === OpenCloseByTimeDirection.OPEN) {
            toOpen = true;
          }

          break;
        }
      }
    }

    let target = this.state.position;

    if (toClose) {
      target = this.settings.properties.position.close;
    }

    if (toOpen) {
      target = this.settings.properties.position.open;
    }

    if ((toClose || toOpen) && this.state.target !== target) {
      if (this.isBlocked(target)) {
        logger.info('Try to change position by time was blocked 🚫 😭');
        logger.debug({
          name: this.name,
          now: this.now,
          toOpen,
          toClose,
          blockMin,
        });

        return;
      }

      if (blockMin > 0) {
        this.block.close = addMinutes(new Date(), blockMin);

        logger.info('The close block 🚫 was activated ✅');
        logger.debug({
          name: this.name,
          now: this.now,
          closeBlock: format(this.block.close, 'yyyy.MM.dd HH:mm:ss OOOO'),
        });

        this.block.open = addMinutes(new Date(), blockMin);

        logger.info('The open block 🚫 was activated ✅');
        logger.debug({
          name: this.name,
          now: this.now,
          openBlock: format(this.block.open, 'yyyy.MM.dd HH:mm:ss OOOO'),
        });
      }

      logger.info('Switching has been performed at a given time point ⏰');
      logger.debug({
        name: this.name,
        now: this.now,
        openCloseByTime,
        toOpen,
        toClose,
        blockMin,
        timePointIsHit,
        target,
        state: this.state,
      });

      this.setTarget(target);
    } else if (timePointIsHit) {
      logger.error('Hitting a time point, but next state the same with current state 🚨');
      logger.error({
        name: this.name,
        now: this.now,
        openCloseByTime,
        toOpen,
        toClose,
        blockMin,
        timePointIsHit,
        target,
        state: this.state,
      });
    }
  };

  private hitTimeRange = (min: number) => {
    if (min > 0 && min < 24 * 60) {
      const hours = this.getDateInClientTimeZone().getHours();
      const minutes = this.getDateInClientTimeZone().getMinutes();

      const fromMin = hours * 60 + minutes - 15;
      const toMin = hours * 60 + minutes + 15;

      logger.info('Checking for hitting a time point ℹ️');
      logger.debug({
        name: this.name,
        now: this.now,
        hours,
        minutes,
        fromMin,
        timePointInMin: min,
        toMin,
        hitting: min >= fromMin && min <= toMin,
      });

      if (min >= fromMin && min <= toMin) {
        logger.info('Hitting a time point 🔘 ✅');
        logger.debug({ name: this.name, fromMin, timePointInMin: min, toMin });

        return true;
      }
    } else {
      logger.info('The time should be in day range 🏙️ 🚨');
      logger.debug({ name: this.name, fromMin: 0, timePointInMin: min, toMin: 24 * 60 });
    }

    return false;
  };

  /**
   * Сбор данных
   */
  protected collecting() {
    this.collectPosition();

    this.collectIllumination();
    this.collectMotion();
    this.collectNoise();
    this.collectTemperature();

    this.showSate();
  }

  private get isMotion(): boolean {
    const { silenceMin } = this.settings.properties;

    return (
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      compareDesc(new Date(), addMinutes(new Date(this.last.motion.getTime()), silenceMin)) === 1
    );
  }

  private get isSilence(): boolean {
    const { silenceMin } = this.settings.properties;

    return (
      Number.isInteger(silenceMin) &&
      silenceMin > 0 &&
      compareAsc(new Date(), addMinutes(new Date(this.last.motion.getTime()), silenceMin)) === 1 &&
      compareAsc(new Date(), addMinutes(new Date(this.last.noise.getTime()), silenceMin)) === 1
    );
  }

  private getPosition = (): number => {
    const { positions } = this.settings.devices;

    return (
      positions.reduce((accumulator, device, index) => {
        const control = this.controls.get(getControlId(device));
        const value = Number.parseInt(control?.value ?? '');

        if (Number.isInteger(value)) {
          if (index === positions.length - 1) {
            return (accumulator + value) / positions.length;
          }

          return accumulator + value;
        }

        return accumulator;
      }, -1) + 1
    );
  };

  private get isRunning(): boolean {
    return this.state.position !== this.state.target && !this.state.stop;
  }

  private get isCoverOpen(): boolean {
    return this.state.position === this.settings.properties.position.open && !this.state.stop;
  }

  private get isCoverMiddle(): boolean {
    const { position: settings } = this.settings.properties;

    const { position, stop } = this.state;

    return (position !== settings.close && position !== settings.open) || stop;
  }

  private get isCoverCloserToOpen(): boolean {
    const { position: settings } = this.settings.properties;

    const { position } = this.state;

    if (settings.open > settings.close) {
      return position > settings.open / 2;
    }

    return position < settings.close / 2;
  }

  private get isCoverCloserToClose(): boolean {
    return !this.isCoverCloserToOpen;
  }

  private get isCoverClose(): boolean {
    return this.state.position === this.settings.properties.position.close && !this.state.stop;
  }

  private getDirection(target = this.state.target): 'OPEN' | 'CLOSE' | 'UNSPECIFIED' {
    const direction = this.state.position - target;

    if (direction === 0) {
      return this.state.direction;
    }

    const { open, close } = this.settings.properties.position;

    /**
     * close: 0, open: 100
     *
     * Например, position 100 (open), target 0 (close), 100 - 0 = 100 > 0 -> CLOSE
     * Например, position 0 (close), target 100 (open), 0 - 100 = -100 < 0 -> OPEN
     * Например, position 30 , target 60, 30 - 60 = -30 < 0 -> OPEN
     * Например, position 30 , target 10, 30 - 10 = 20 > 0 -> CLOSE
     */
    if (close < open) {
      if (direction > 0) {
        return 'CLOSE';
      }

      if (direction < 0) {
        return 'OPEN';
      }
    }

    /**
     * close: 100, open: 0
     *
     * Например, position 100 (close), target 0 (open), 100 - 0 = 100 > 0 -> OPEN
     * Например, position 0 (open), target 100 (close), 0 - 100 = -100 < 0 -> CLOSE
     * Например, position 30 , target 60, 30 - 60 = -30 < 0 -> CLOSE
     * Например, position 30 , target 10, 30 - 10 = 20 > 0 -> OPEN
     */
    if (close > open) {
      if (direction > 0) {
        return 'OPEN';
      }

      if (direction < 0) {
        return 'CLOSE';
      }
    }

    return 'UNSPECIFIED';
  }

  private get isIlluminationReady() {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (low.closeLux > low.openLux) {
      logger.error('The low.closeLux should be less then low.openLux 🚨');
      logger.error({ properties: this.settings.properties });
    }

    if (low.openLux > hi.openLux) {
      logger.error('The low.openLux should be less then hi.openLux 🚨');
      logger.error({ properties: this.settings.properties });
    }

    if (hi.openLux > hi.closeLux) {
      logger.error('The hi.openLux should be less then hi.closeLux 🚨');
      logger.error({ properties: this.settings.properties });
    }

    return (
      illumination.average >= 0 &&
      low.closeLux > 0 &&
      low.openLux > 0 &&
      hi.closeLux > 0 &&
      hi.openLux > 0 &&
      low.closeLux < low.openLux &&
      low.openLux < hi.openLux &&
      hi.openLux < hi.closeLux
    );
  }

  private get isCloseBySunReady(): boolean {
    const { closeBySun } = this.settings.properties;

    const { temperature } = this.state;

    if (closeBySun.illumination.closeLux < closeBySun.illumination.openLux) {
      logger.error('The closeBySun.illumination.closeLux should be more then closeBySun.illumination.openLux 🚨');
      logger.error({ name: this.name, properties: this.settings.properties });
    }

    return (
      temperature > 0 &&
      closeBySun.temperature > 0 &&
      closeBySun.illumination.closeLux > 0 &&
      closeBySun.illumination.openLux > 0 &&
      closeBySun.illumination.closeLux > closeBySun.illumination.openLux
    );
  }

  private get isCloseByLighting(): boolean {
    const { low } = this.settings.properties.illumination;

    const { lighting, illumination } = this.state;

    return lighting === Lighting.ON && illumination.beforeTurningOnLighting <= low.closeLux;
  }

  private get isEnoughLightingToClose(): boolean {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (this.isIlluminationReady) {
      /**
       * Решение принимается при любом положении шторы
       */
      const isEnoughToCloseByLow = illumination.average <= low.closeLux;

      /**
       * Решение принимается при открытой шторе
       */
      const isEnoughToCloseByHi = illumination.average >= hi.closeLux && (this.isCoverOpen || this.isCoverCloserToOpen);

      return isEnoughToCloseByLow || isEnoughToCloseByHi;
    }

    return false;
  }

  private get isEnoughSunActiveToClose(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination, temperature } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination.average >= closeBySun.illumination.closeLux &&
      temperature >= closeBySun.temperature &&
      /**
       * Решение принимается при открытой шторе
       */
      (this.isCoverOpen || this.isCoverCloserToOpen)
    );
  }

  private get isEnoughSunActiveToOpen(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination, temperature } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination.average <= closeBySun.illumination.openLux &&
      temperature <= closeBySun.temperature &&
      /**
       * Решение принимается при закрытой шторе
       */
      (this.isCoverClose || this.isCoverCloserToClose)
    );
  }

  private get isEnoughLightingToOpen(): boolean {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    return (
      this.isIlluminationReady &&
      illumination.average >= low.openLux &&
      illumination.average <= hi.openLux &&
      /**
       * Решение принимается при закрытой шторе
       */
      (this.isCoverClose || this.isCoverCloserToClose)
    );
  }

  private get hasOpenBlock(): boolean {
    return compareAsc(this.block.open, new Date()) === 1;
  }

  private get hasCloseBlock(): boolean {
    return compareAsc(this.block.close, new Date()) === 1;
  }

  private get hasAllBlock(): boolean {
    return compareAsc(this.block.all, new Date()) === 1;
  }

  private collectPosition = () => {
    const current = this.getPosition();

    if (this.state.position === -1 || this.state.target === -1) {
      this.state.position = current;
      this.state.target = current;

      logger.info('The starting position of the curtain has been determined 🩻');
      logger.debug({
        name: this.name,
        now: this.now,
        current,
        state: this.state,
      });

      this.requestPositions();
    }

    if (this.state.position !== current) {
      logger.info('The position of the curtain has changed 🔁 🪟');

      this.state.position = current;

      if (this.state.stop) {
        this.state.target = current;
      }

      logger.debug({
        name: this.name,
        now: this.now,
        current,
        state: this.state,
      });
    }
  };

  private collectLightings = () => {
    const { lightings } = this.settings.devices;

    const isLightingOn = lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      return control?.value === control?.on;
    });

    const nextLighting = isLightingOn ? Lighting.ON : Lighting.OFF;

    if (this.state.lighting !== nextLighting) {
      if (nextLighting === Lighting.ON) {
        logger.info('The lighting is on 💡');
        logger.debug({ name: this.name, now: this.now });

        this.state.illumination.beforeTurningOnLighting = this.state.illumination.measured;
      }

      if (nextLighting === Lighting.OFF) {
        logger.info('The lighting is off 🕯️');
        logger.debug({ name: this.name, now: this.now });

        this.state.illumination.beforeTurningOnLighting = 0;
        this.state.illumination.descent = -1;

        this.block.all = addSeconds(new Date(), 30);

        logger.info('The all block 🚫 was activated for 30 ⏱️ seconds ✅');
      }

      logger.debug({
        name: this.name,
        now: this.now,
        allBlock: format(this.block.all, 'yyyy.MM.dd HH:mm:ss OOOO'),
        nextLighting,
        state: this.state,
      });

      this.state.lighting = nextLighting;
    }
  };

  private collectIllumination = () => {
    this.collectLightings();

    const { illuminations } = this.settings.devices;
    const { illumination } = this.settings.properties;
    const { beforeTurningOnLighting, descent, measured: lastMeasured } = this.state.illumination;

    const nextMeasured = this.getValueByDetection(illuminations, illumination.detection);

    if (this.state.lighting === Lighting.ON) {
      /**
       * Следуем вниз за освещенностью.
       *
       * Процедура collecting тротлится с задержкой 500 мс, и фактически она запускается каждые 500 мс,
       * так как данные с датчиков освещенности прилетают каждые несколько десятков мс,
       * выходит, что 1200 тактов это 10 минут.
       *
       * Как только освещенность перестанет падать на 10 единиц в течении 5 минут, считаем, что наступила ночь.
       */
      if (lastMeasured > nextMeasured && descent < 1200) {
        const diff = Math.abs(lastMeasured - nextMeasured);
        const isTangibleChange = diff > (nextMeasured > 100 ? 20 : 10);

        if (isTangibleChange) {
          this.state.illumination.measured = nextMeasured;
          this.state.illumination.descent = 0;

          logger.info('After following the illumination 🌅 🌇, the nightfall counter will be reset 🆑');
        } else {
          this.state.illumination.descent += 1;

          // eslint-disable-next-line unicorn/consistent-destructuring
          if (this.state.illumination.descent >= 1200) {
            logger.info(
              'The illumination has stopped changing in the last 10 minutes, which means that night has fallen. 🌃 🌙',
            );

            this.state.illumination.beforeTurningOnLighting = 0;
          } else {
            logger.info('Counting down to nightfall 🔄 🌃 🌙');
          }
        }

        logger.debug({
          name: this.name,
          now: this.now,
          beforeTurningOnLighting,
          lastMeasured,
          nextMeasured,
          diff,
          state: this.state,
        });
      }

      this.state.illumination.average = this.computeMovingArrange('illumination', beforeTurningOnLighting);
    }

    if (this.state.lighting === Lighting.OFF) {
      this.state.illumination.average = this.computeMovingArrange('illumination', nextMeasured);
    }
  };

  private collectMotion = () => {
    const { motions } = this.settings.devices;
    const { motion } = this.settings.properties;

    this.state.motion = this.getValueByDetection(motions, motion.detection);

    if (this.state.motion >= motion.trigger) {
      this.last.motion = new Date();
    }
  };

  private collectNoise = () => {
    const { noises } = this.settings.devices;
    const { noise } = this.settings.properties;

    this.state.noise = this.getValueByDetection(noises, noise.detection);

    if (this.state.noise >= noise.trigger) {
      this.last.noise = new Date();
    }
  };

  private collectTemperature = () => {
    const { temperatures } = this.settings.devices;
    const { temperature } = this.settings.properties;

    this.state.temperature = this.getValueByDetection(temperatures, temperature.detection);
  };

  /**
   * Приоритетное изменение состояния.
   */
  protected priorityComputation = () => {
    return false;
  };

  /**
   * Автоматизации по датчикам.
   */
  protected sensorBasedComputing = (): boolean => {
    const { position } = this.settings.properties;

    /**
     * Для установки следующего целевого положения используется position
     * так как он обновляется через обратную связь с устройствами
     * и может изменяться внешним относительно макроса способом.
     */
    let nextTarget = this.state.position;

    const context = {
      name: this.name,
      now: this.now,
      settings: { position },
      state: this.state,
      currentPositionOfControls: this.getPosition(),
      nextTarget,
      isBlocked: this.isBlocked(nextTarget),
      hasOpenBlock: this.hasOpenBlock,
      hasCloseBlock: this.hasCloseBlock,
      hasAllBlock: this.hasAllBlock,
      block: this.block,
      isMotion: this.isMotion,
      isSilence: this.isSilence,
      last: this.last,
      isCoverClose: this.isCoverClose,
      isCoverMiddle: this.isCoverMiddle,
      isCoverOpen: this.isCoverOpen,
      isCoverCloserToOpen: this.isCoverCloserToOpen,
      isCoverCloserToClose: this.isCoverCloserToClose,
      isIlluminationReady: this.isIlluminationReady,
      isCloseByLighting: this.isCloseByLighting,
      isEnoughLightingToClose: this.isEnoughLightingToClose,
      isCloseBySunReady: this.isCloseBySunReady,
      isEnoughSunActiveToClose: this.isEnoughSunActiveToClose,
      isEnoughSunActiveToOpen: this.isEnoughSunActiveToOpen,
      isEnoughLightingToOpen: this.isEnoughLightingToOpen,
    };
    if (this.isCloseByLighting) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        context.nextTarget = nextTarget;
        context.isBlocked = this.isBlocked(nextTarget);

        logger.info('Close because enabled lighting 💡');
        logger.trace(context);
      }
    } else if (this.isEnoughLightingToClose) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        context.nextTarget = nextTarget;
        context.isBlocked = this.isBlocked(nextTarget);

        logger.info('Close because enough lighting to close 🌃 or 🌇');
        logger.trace(context);
      }
    } else if (this.isEnoughSunActiveToClose) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        context.nextTarget = nextTarget;
        context.isBlocked = this.isBlocked(nextTarget);

        logger.info('Close because sun is active 🌅 🌇 🌞 🥵');
        logger.trace(context);
      }
    } else if (this.isEnoughSunActiveToOpen && this.isMotion) {
      if (nextTarget !== position.open) {
        nextTarget = position.open;

        context.nextTarget = nextTarget;
        context.isBlocked = this.isBlocked(nextTarget);

        logger.info('Open because sun is not active 🪭 😎 🆒');
        logger.trace(context);
      }
    } else if (this.isEnoughLightingToOpen && this.isMotion && nextTarget !== position.open) {
      nextTarget = position.open;

      context.nextTarget = nextTarget;
      context.isBlocked = this.isBlocked(nextTarget);

      logger.info('Open because enough lighting to open 🌅 💡');
      logger.trace(context);
    }

    this.showSensorContext(context);

    if (this.state.target === nextTarget) {
      this.retryToApplyNextState();

      return true;
    } else {
      if (this.isBlocked(nextTarget)) {
        logger.info('Try to change position by sensors was blocked 🚫 😭');

        return false;
      }

      logger.info('A target was determined by the sensors 📡');

      this.setTarget(nextTarget);

      return true;
    }
  };

  /**
   * Автоматизация по переключателям.
   */
  protected actionBasedComputing = (current?: HyperionDevice): boolean => {
    const { switcher, illumination, position } = this.settings.properties;

    let isSwitchHasBeenChange = false;

    if (switcher.trigger === Trigger.UP) {
      isSwitchHasBeenChange = this.isSwitchHasBeenUp();

      if (isSwitchHasBeenChange) {
        logger.info('The switch was closed 🔒');
        logger.debug({ name: this.name });
      }
    }

    if (switcher.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      if (isSwitchHasBeenChange) {
        logger.info('The switch was open 🔓');
        logger.debug({ name: this.name });
      }
    }

    if (this.isButtonChange(current)) {
      isSwitchHasBeenChange = true;

      logger.info('The button was touched 👉 🔘');
      logger.debug({
        name: this.name,
        now: this.now,
        position,
        currentPositionOfControls: this.getPosition(),
        state: this.state,
      });
      logger.trace({
        hasOpenBlock: this.hasOpenBlock,
        hasCloseBlock: this.hasCloseBlock,
        hasAllBlock: this.hasAllBlock,
        isCoverClose: this.isCoverClose,
        isCoverMiddle: this.isCoverMiddle,
        isCoverOpen: this.isCoverOpen,
        isCoverCloserToOpen: this.isCoverCloserToOpen,
        isCoverCloserToClose: this.isCoverCloserToClose,
        isMotion: this.isMotion,
        isSilence: this.isSilence,
        lastMotion: this.last.motion,
        lastNoise: this.last.noise,
        isIlluminationReady: this.isIlluminationReady,
        isCloseBySunReady: this.isCloseBySunReady,
        isEnoughLightingToClose: this.isEnoughLightingToClose,
        isEnoughSunActiveToClose: this.isEnoughSunActiveToClose,
        isEnoughSunActiveToOpen: this.isEnoughSunActiveToOpen,
        isEnoughLightingToOpen: this.isEnoughLightingToOpen,
        button: current?.controls.filter((control) =>
          this.settings.devices.buttons.some(
            (button) => button.deviceId === current.id && button.controlId === control.id,
          ),
        ),
      });
    }

    if (isSwitchHasBeenChange) {
      if (this.isRunning) {
        logger.info('The curtain was stopped by the user 🚫 🚹 🏌️‍♂️');

        this.stopCurtains();

        return true;
      }

      let target: number = this.state.position;

      if (this.isCoverOpen) {
        target = position.close;

        this.state.direction = 'CLOSE';

        logger.info('The curtain will be closed as it is in a fully open state 🔒 🚹');
      } else if (this.isCoverClose) {
        target = position.open;

        this.state.direction = 'OPEN';

        logger.info('The curtain will be open since it is in a completely closed state 🔓 🚹');
      } else if (this.isCoverMiddle) {
        switch (this.state.direction) {
          case 'OPEN': {
            target = position.close;

            this.state.direction = 'CLOSE';

            logger.info('The curtain will be closed, as it was opened before ⏪ 🚹');

            break;
          }
          case 'CLOSE': {
            target = position.open;

            this.state.direction = 'OPEN';

            logger.info('The curtain will be open, as it was closed before ⏩ 🚹');

            break;
          }
          case 'UNSPECIFIED': {
            logger.info('The last direction is not defined 🚨');

            target = position.open;

            this.state.direction = 'OPEN';

            break;
          }
          default: {
            logger.info('The direction is undefined 🚨');
          }
        }
      }

      logger.debug({ name: this.name, target, state: this.state });

      if (this.state.target !== target) {
        const isLowPrioritySwitcher = switcher.type === SwitchType.SEALED_CONTACT || switcher.type === SwitchType.RELAY;

        /**
         * Запрет переключения, по средством геркона, реле или других
         * низко приоритетных переключателей, при наличии блокировок.
         *
         * ! Реализация приоритета блокировок.
         */
        if (isLowPrioritySwitcher && this.isBlocked(target)) {
          logger.info('Try to change curtain state was blocked 🚫 😭');

          return false;
        }

        /**
         * Запрет открытия, в случае реакции на геркон, реле или другой низко
         * приоритетный переключатель, при недостаточной освещенности.
         *
         * ! Реализация приоритета достаточности освещенности.
         */
        let { blockMin } = switcher;

        if (isLowPrioritySwitcher && target === position.open && !this.isEnoughLightingToOpen) {
          logger.info('The illumination is not enough to open by low priority switcher 🚫 😭');
          logger.debug({ name: this.name, illumination, target, state: this.state });

          return false;
        }

        if (blockMin > 0) {
          if (target === position.open) {
            this.block.close = addMinutes(new Date(), blockMin);

            logger.info('The close block 🚫 was activated ✅');
            logger.debug({ closeBlock: format(this.block.close, 'yyyy.MM.dd HH:mm:ss OOOO') });
          }

          if (target === position.close) {
            this.block.open = addMinutes(new Date(), blockMin);

            logger.info('The open block 🚫 was activated ✅');
            logger.debug({ openBlock: format(this.block.open, 'yyyy.MM.dd HH:mm:ss OOOO') });
          }
        }

        this.setTarget(target);

        return true;
      }
    }

    return false;
  };

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.devices.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.devices.switchers);
  }

  private isButtonChange(current?: HyperionDevice): boolean {
    if (!current) {
      return false;
    }

    const { buttons } = this.settings.devices;

    const isButtonChange = buttons.some(({ deviceId, controlId, controlType }) =>
      current.controls.find(
        (control) =>
          current.id === deviceId &&
          control.id === controlId &&
          control.type === controlType &&
          control.enum.includes(control.value),
      ),
    );

    const isButtonStatus = buttons.some(({ deviceId, controlId, controlType }) =>
      current.controls.find(
        (control) =>
          current.id === deviceId &&
          control.id === controlId &&
          control.type === controlType &&
          !control.enum.includes(control.value),
      ),
    );

    if (isButtonStatus) {
      logger.info(
        'A notification about the status of the button has been received, without specifying an action ℹ️ ℹ️ ℹ️',
      );
      logger.debug({
        name: this.name,
        now: this.now,
        buttons: buttons.map((button) => this.controls.get(getControlId(button))),
      });
    }

    if (isButtonChange && this.skip.firstButtonChange.length > 0) {
      logger.info('The first button change was skipped ⏭️');
      logger.debug({
        name: this.name,
        now: this.now,
        isButtonChange,
        buttons,
        skip: this.skip.firstButtonChange,
        button: current?.controls
          .filter((control) =>
            buttons.some((button) => button.deviceId === current.id && button.controlId === control.id),
          )
          .map((button) => ({ id: button.id, enum: button.enum, value: button.value })),
      });

      this.skip.firstButtonChange = this.skip.firstButtonChange.filter(
        ({ deviceId, controlId, controlType }) =>
          !current.controls.some(
            (control) =>
              current.id === deviceId &&
              control.id === controlId &&
              control.type === controlType &&
              control.enum.includes(control.value),
          ),
      );

      logger.debug({ skip: this.skip.firstButtonChange });

      return false;
    }

    return isButtonChange;
  }

  /**
   * Отправка сообщений.
   */
  private retryToApplyNextState = () => {
    logger.info('Retry to apply target to control 🔁');
    logger.debug({
      name: this.name,
      now: this.now,
      state: this.state,
      positions: this.settings.devices.positions.map((item) => {
        const control = this.controls.get(getControlId(item));

        if (control) {
          return {
            ...item,
            max: control.max,
            min: control.min,
            enum: control.enum,
            on: control.on,
            off: control.off,
            toggle: control.toggle,
            value: control.value,
          };
        }
      }),
    });

    if (this.hasAllBlock) {
      logger.info('Skip retry to apply target to control ⏩, because all block enabled');

      return;
    }

    const { devices } = this.settings;

    for (const item of devices.positions) {
      const control = this.controls.get(getControlId(item));

      /**
       * ! Если для данного контрола мы не достигли цели,
       * ! нужно отправить ему ещё одно сообщение с требуемой позицией.
       */
      if (control && String(this.state.target) !== String(control?.value)) {
        logger.info(
          // eslint-disable-next-line max-len
          'A discrepancy between the control position of the curtain and the internal position of the curtain macro was found ‼ 🪟',
        );
        logger.info('All curtains will be updated according to the internal state of the curtain macro 🪟');
        logger.debug({ state: this.state, positionFromControl: control?.value });

        this.computeOutput();
        this.send();

        return;
      }
    }
  };

  private stopCurtains = () => {
    this.output.states = [];

    for (const device of this.settings.devices.states) {
      const controlType = ControlType.ENUM;
      const control = this.controls.get(getControlId(device));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The state control specified in the settings was not found 🚨');
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

      this.output.states.push({ ...device, value: this.settings.properties.state.stop });
    }

    logger.info('The output for stop 🛑 curtain was computed 💻');
    logger.debug({
      name: this.name,
      now: this.now,
      state: this.state,
      devices: this.settings.devices.states,
      output: this.output,
    });

    if (this.output.states.length > 0) {
      this.state.stop = true;
      this.block.all = addSeconds(new Date(), 30);

      logger.info('The all block 🚫 was activated for 30 ⏱️ seconds ✅');
      logger.debug({ name: this.name, now: this.now, allBlock: format(this.block.all, 'yyyy.MM.dd HH:mm:ss OOOO') });
    }

    this.send();
  };

  private requestPositions = () => {
    logger.info('An attempt has begun to request the current position of the curtain 💎');

    for (const device of this.settings.devices.positions) {
      const hyperionDevice = this.devices.get(device.deviceId);
      const hyperionControl = this.controls.get(getControlId(device));
      const topic = hyperionControl?.topic.read;
      const message = '';

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error({
          name: this.name,
          now: this.now,
          hyperionDevice,
          controlId: getControlId(device),
          hyperionControl,
          device,
        });

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        state: this.state,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    this.block.all = addSeconds(new Date(), 30);

    logger.info('The all block 🚫 was activated for 30 ⏱️ seconds ✅');
    logger.debug({ name: this.name, now: this.now, allBlock: format(this.block.all, 'yyyy.MM.dd HH:mm:ss OOOO') });
  };

  protected computeOutput = () => {
    this.output.positions = [];

    for (const position of this.settings.devices.positions) {
      const controlType = ControlType.VALUE;
      const control = this.controls.get(getControlId(position));

      if (!control || control.type !== controlType || !control.topic.write) {
        logger.error('The position control specified in the settings was not found 🚨');
        logger.error({
          name: this.name,
          now: this.now,
          position,
          controlType,
          control,
          controls: this.controls.size,
        });

        continue;
      }

      const value = this.state.target;

      if (String(control.value) !== String(value)) {
        this.output.positions.push({ ...position, value });
      }
    }

    logger.info('The output for change 🏃‍♀️‍➡️ position was computed 💻');
    logger.debug({
      name: this.name,
      now: this.now,
      devices: this.settings.devices.positions,
      state: this.state,
      output: this.output,
    });

    if (this.output.positions.length > 0) {
      this.state.stop = false;
    }
  };

  protected send = () => {
    for (const state of this.output.states) {
      const hyperionDevice = this.devices.get(state.deviceId);
      const hyperionControl = this.controls.get(getControlId(state));
      const topic = hyperionControl?.topic.write;
      const message = state.value;

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error({
          name: this.name,
          now: this.now,
          hyperionDevice,
          controlId: getControlId(state),
          hyperionControl,
          state,
        });

        continue;
      }

      logger.info('The message will be sent to the wirenboard controller 📟');
      logger.debug({
        name: this.name,
        now: this.now,
        state: this.state,
        topic,
        message,
      });

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    for (const position of this.output.positions) {
      const hyperionDevice = this.devices.get(position.deviceId);
      const hyperionControl = this.controls.get(getControlId(position));
      const topic = hyperionControl?.topic.write;
      const message = String(position.value);

      if (!hyperionDevice || !hyperionControl || !topic) {
        logger.error(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger.error({
          name: this.name,
          now: this.now,
          hyperionDevice,
          controlId: getControlId(position),
          hyperionControl,
          position,
        });

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

    this.output = { states: [], positions: [] };
  };

  protected destroy() {
    clearInterval(this.timer.timeBasedComputing);
    clearInterval(this.timer.illuminationMovingArrange);
  }
}

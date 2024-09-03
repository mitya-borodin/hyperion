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
 * Перечень настроек которые требуются для создания экземпляра макроса.
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
     * Позволяет закрывать штору при излишней освещенности и открыть при возврате
     * к достаточному уровню освещенности в рамках дня.
     */
    readonly illumination: {
      readonly detection: LevelDetection;

      /**
       * Порог достаточной солнечной активности, чтобы вернуть штору
       * в открытое положение в рамках светового дня, это значение
       * оценивается при открытой шторе.
       */
      readonly lightEnoughLux: number;

      /**
       * Порог высокой солнечной активности, если он превышен,
       * штора закрывается, это значение оценивается при открытой шторе.
       */
      readonly tooSunnyLux: number;
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
      /**
       * Порог достаточной солнечной активности, чтобы вернуть штору
       * в открытое положение в рамках светового дня, это значение
       * оценивается при закрытой шторе.
       */
      readonly lightEnoughLux: number;

      /**
       * Порог высокой солнечной активности, если он превышен,
       * штора закрывается, это значение оценивается при открытой шторе.
       */
      readonly tooSunnyLux: number;

      /**
       * Температура, свыше которой штора закрывается.
       */
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
  };
  motion: number;
  noise: number;
  temperature: number;
};

type CurtainMacrosState = CurtainMacrosPublicState & CurtainMacrosPrivateState;

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
  },
  motion: -1,
  noise: -1,
  temperature: -1,
};

const createDefaultState = () => cloneDeep(defaultState);

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

/**
 * ! PARAMETERS
 */
type CurtainMacrosParameters = MacrosParameters<string, string | undefined>;

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
    computeMovingArrange: NodeJS.Timeout;
    requestPositions: NodeJS.Timeout;
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
      computeMovingArrange: setInterval(() => this.computeMovingArrange('illumination', -1), 60 * 1000),
      requestPositions: setInterval(() => this.requestPositions(), 2 * 60 * 1000),
    };

    this.skip.firstButtonChange = cloneDeep(this.settings.devices.buttons);

    this.retryToApplyNextState = throttle(this.retryToApplyNextState, 60 * 1000);

    this.showSate = throttle(this.showSate, 60 * 1000);
    this.showSensorContext = throttle(this.showSensorContext, 60 * 1000);
  }

  private getDebugContext = (mixin = {}) => {
    return {
      name: this.name,
      now: this.now,
      mixin,
      state: this.state,
      output: this.output,
      time: this.time,
      isDay: this.isDay,
      isNight: this.isNight,
      currentPositionOfControls: this.getPosition(),
      block: this.block,
      hasOpenBlock: this.hasOpenBlock,
      hasCloseBlock: this.hasCloseBlock,
      hasAllBlock: this.hasAllBlock,
      last: this.last,
      isMotion: this.isMotion,
      isSilence: this.isSilence,
      isCoverClose: this.isCoverClose,
      isCoverMiddle: this.isCoverMiddle,
      isCoverOpen: this.isCoverOpen,
      isCoverCloserToOpen: this.isCoverCloserToOpen,
      isCoverCloserToClose: this.isCoverCloserToClose,
      isIlluminationReady: this.isIlluminationReady,
      isCloseBySunReady: this.isCloseBySunReady,
      isTooSunny: this.isTooSunny,
      isTooSunnyAndHot: this.isTooSunnyAndHot,
      isEnoughSunnyAndCool: this.isEnoughSunnyAndCool,
      isEnoughSunny: this.isEnoughSunny,
    };
  };

  /**
   * Высокочастотные логи.
   */
  private showSate = () => {
    // logger.info('The calculation 💻 of the state 🇺🇸 is completed ✅');
    // logger.debug(this.getDebugContext());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showSensorContext = (context: any) => {
    // logger.info('The context of sensor 📡 based computing 💻');
    // logger.debug(context);
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

    // logger.info('The next public state was supplied 📥');
    // logger.debug(this.getDebugContext({ nextState }));

    if (this.state.target === nextState.target) {
      logger.warning('The received state does not differ from the current one 🚨');
      logger.debug(this.getDebugContext({ nextState }));
    } else {
      this.state.target = nextState.target;
      this.state.direction = this.getDirection();

      logger.info('The next state was applied 🫒 by set state in manual mode 🚹');
      logger.debug(this.getDebugContext({ nextState }));

      this.computeOutput();
      this.send();
    }
  };

  private setTarget(nextTarget: number) {
    if (this.state.target !== nextTarget) {
      this.state.target = nextTarget;
      this.state.direction = this.getDirection();

      // logger.info('The next target 🎯 position was set ✅');
      // logger.debug(this.getDebugContext({ nextTarget, position: this.settings.properties.position }));

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
      logger.info('The OPEN is blocked 🚫 until the set time ⏱️');
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
      logger.info('The CLOSE is blocked 🚫 until the set time ⏱️');
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

  private get hasOpenBlock(): boolean {
    return compareAsc(this.block.open, new Date()) === 1;
  }

  private get hasCloseBlock(): boolean {
    return compareAsc(this.block.close, new Date()) === 1;
  }

  private get hasAllBlock(): boolean {
    return compareAsc(this.block.all, new Date()) === 1;
  }

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

    // logger.info('The time based computing was run ⏰');
    // logger.debug(this.getDebugContext({ openCloseByTime }));

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
        logger.debug(this.getDebugContext({ toOpen, toClose, blockMin }));

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

      // logger.info('Switching has been performed at a given time point ⏱️');
      // logger.debug(this.getDebugContext({ openCloseByTime, toOpen, toClose, blockMin, timePointIsHit, target }));

      this.setTarget(target);
    } else if (timePointIsHit) {
      logger.error('Hitting a time point, but next state the same with current state 🚨');
      logger.error(
        this.getDebugContext({
          openCloseByTime,
          toOpen,
          toClose,
          blockMin,
          timePointIsHit,
          target,
        }),
      );
    }
  };

  private hitTimeRange = (min: number) => {
    if (min > 0 && min < 24 * 60) {
      const hours = this.getDate().getHours();
      const minutes = this.getDate().getMinutes();

      const fromMin = hours * 60 + minutes - 15;
      const toMin = hours * 60 + minutes + 15;

      // logger.info('Checking for hitting a time point ⏱️');
      // logger.debug(
      //   this.getDebugContext({
      //     hours,
      //     minutes,
      //     fromMin,
      //     timePointInMin: min,
      //     toMin,
      //     hitting: min >= fromMin && min <= toMin,
      //   }),
      // );

      if (min >= fromMin && min <= toMin) {
        logger.info('Hitting a time point ⏱️');
        logger.debug(
          this.getDebugContext({
            fromMin,
            timePointInMin: min,
            toMin,
          }),
        );

        return true;
      }
    } else {
      logger.info('The time should be in day range 🚨');
      logger.debug(
        this.getDebugContext({
          fromMin: 0,
          timePointInMin: min,
          toMin: 24 * 60,
        }),
      );
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

  private get isCoverCloserToOpen(): boolean {
    const { position: settings } = this.settings.properties;

    const { position } = this.state;

    if (settings.open > settings.close) {
      return position > settings.open / 2;
    }

    return position < settings.close / 2;
  }

  private get isCoverMiddle(): boolean {
    const { position: settings } = this.settings.properties;

    const { position, stop } = this.state;

    return (position !== settings.close && position !== settings.open) || stop;
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
    const { lightEnoughLux, tooSunnyLux } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (tooSunnyLux < lightEnoughLux) {
      logger.error('The tooSunnyLux should be more then lightEnoughLux 🚨');
      logger.error(this.getDebugContext({ properties: this.settings.properties }));
    }

    return illumination.average >= 0 && tooSunnyLux > 0 && lightEnoughLux > 0 && tooSunnyLux > lightEnoughLux;
  }

  private get isCloseBySunReady(): boolean {
    const { closeBySun } = this.settings.properties;

    const { temperature } = this.state;

    if (closeBySun.tooSunnyLux < closeBySun.lightEnoughLux) {
      logger.error(
        'The closeBySun.illumination.tooSunnyLux should be more then closeBySun.illumination.lightEnoughLux 🚨',
      );
      logger.error(this.getDebugContext({ properties: this.settings.properties }));
    }

    return (
      temperature > 0 &&
      closeBySun.temperature > 0 &&
      closeBySun.tooSunnyLux > 0 &&
      closeBySun.lightEnoughLux > 0 &&
      closeBySun.tooSunnyLux > closeBySun.lightEnoughLux
    );
  }

  /**
   * Когда солнечная активность превышает указанное значение, штора закрывается 🌇
   */
  private get isTooSunny(): boolean {
    const { tooSunnyLux } = this.settings.properties.illumination;

    const { illumination } = this.state;

    if (this.isIlluminationReady) {
      return (
        illumination.average >= tooSunnyLux &&
        /**
         * Решение принимается при открытой шторе
         */
        (this.isCoverOpen || this.isCoverCloserToOpen) &&
        /**
         * Решение принимается только в рамках дня.
         */
        this.isDay
      );
    }

    return false;
  }

  /**
   * Когда освещенность стала приемлемой, штора открывается 🌁
   */
  private get isEnoughSunny(): boolean {
    const { lightEnoughLux } = this.settings.properties.illumination;

    const { illumination } = this.state;

    return (
      this.isIlluminationReady &&
      illumination.average <= lightEnoughLux &&
      /**
       * Решение принимается при закрытой шторе
       */
      (this.isCoverClose || this.isCoverCloserToClose) &&
      /**
       * Открывание шторы возможно только при наличии движения
       */
      this.isMotion &&
      /**
       * Открывание шторы возможно только днем
       */
      this.isDay
    );
  }

  /**
   * Когда стало слишком солнечно и жарко, штора закрывается 🥵
   */
  private get isTooSunnyAndHot(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination, temperature } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination.average >= closeBySun.tooSunnyLux &&
      temperature >= closeBySun.temperature &&
      /**
       * Решение принимается при открытой шторе
       */
      (this.isCoverOpen || this.isCoverCloserToOpen) &&
      /**
       * Решение принимается только в рамках дня.
       */
      this.isDay
    );
  }

  /**
   * Когда стало менее жарко и солнечно, штора отрывается 🪭
   */
  private get isEnoughSunnyAndCool(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination, temperature } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination.average <= closeBySun.lightEnoughLux &&
      temperature <= closeBySun.temperature &&
      /**
       * Решение принимается при закрытой шторе
       */
      (this.isCoverClose || this.isCoverCloserToClose) &&
      /**
       * Открывание шторы возможно только при наличии движения.
       */
      this.isMotion &&
      /**
       * Открывание шторы возможно только днем.
       */
      this.isDay
    );
  }

  private collectPosition = () => {
    const current = this.getPosition();

    if (this.state.position === -1 || this.state.target === -1) {
      this.state.position = current;
      this.state.target = current;

      logger.info('The starting position of the curtain has been determined 🩻');
      logger.debug(this.getDebugContext({ current }));

      this.requestPositions();
    }

    if (this.state.position !== current) {
      logger.info('The position of the curtain has changed 🔁 🪟');

      const previousState = cloneDeep(this.state);

      this.state.position = current;

      if (this.state.stop) {
        this.state.target = current;
      }

      logger.debug(this.getDebugContext({ current, previousState }));
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
      const previousState = cloneDeep(this.state);

      if (nextLighting === Lighting.ON) {
        logger.info('The lighting is ON 💡');

        this.state.illumination.beforeTurningOnLighting = this.state.illumination.average;
      }

      if (nextLighting === Lighting.OFF) {
        logger.info('The lighting is OFF 🕯️');

        this.state.illumination.beforeTurningOnLighting = 0;
      }

      logger.debug(this.getDebugContext({ nextLighting, previousState }));

      this.state.lighting = nextLighting;
    }
  };

  private collectIllumination = () => {
    this.collectLightings();

    const { illuminations } = this.settings.devices;
    const { illumination } = this.settings.properties;

    this.state.illumination.measured = this.getValueByDetection(illuminations, illumination.detection);

    const { measured, beforeTurningOnLighting } = this.state.illumination;

    if (this.state.lighting === Lighting.ON && beforeTurningOnLighting > 0) {
      this.state.illumination.average = this.computeMovingArrange('illumination', beforeTurningOnLighting);
    }

    if (this.state.lighting === Lighting.OFF) {
      this.state.illumination.average = this.computeMovingArrange('illumination', measured);
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

    /**
     * ! Порядок следования условия важен, не стоит бездумно перемешивать его.
     */
    if (this.isNight) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        logger.info('Close because night has fallen 🌙');
        logger.trace(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));
      }
    } else if (this.isTooSunny) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        logger.info('Closes because is too sunny 🌇');
        logger.trace(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));
      }
    } else if (this.isTooSunnyAndHot) {
      if (nextTarget !== position.close) {
        nextTarget = position.close;

        logger.info('Closes because is to sunny 🌇 and hot 🥵');
        logger.trace(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));
      }
    } else if (this.isEnoughSunnyAndCool) {
      if (nextTarget !== position.open) {
        nextTarget = position.open;

        logger.info('Open because is enough sunny 🌃 and cool 🪭');
        logger.trace(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));
      }
    } else if (this.isEnoughSunny && nextTarget !== position.open) {
      nextTarget = position.open;

      logger.info('Open because is enough sunny 🌁');
      logger.trace(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));
    }

    this.showSensorContext(this.getDebugContext({ nextTarget, isBlocked: this.isBlocked(nextTarget) }));

    if (this.state.target === nextTarget) {
      this.retryToApplyNextState();

      return true;
    } else {
      if (this.isBlocked(nextTarget)) {
        logger.info('Try to change position by sensors was blocked 🚫 😭');

        return false;
      }

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
      logger.debug(
        this.getDebugContext({
          button: current?.controls.filter((control) =>
            this.settings.devices.buttons.some(
              (button) => button.deviceId === current.id && button.controlId === control.id,
            ),
          ),
        }),
      );
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

      logger.debug(this.getDebugContext());

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

        if (isLowPrioritySwitcher && target === position.open && !this.isEnoughSunny) {
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
    // logger.info('Retry to apply target to control 🔁');
    // logger.debug(
    //   this.getDebugContext({
    //     positions: this.settings.devices.positions.map((item) => {
    //       const control = this.controls.get(getControlId(item));

    //       if (control) {
    //         return {
    //           ...item,
    //           max: control.max,
    //           min: control.min,
    //           enum: control.enum,
    //           on: control.on,
    //           off: control.off,
    //           toggle: control.toggle,
    //           value: control.value,
    //         };
    //       }
    //     }),
    //   }),
    // );

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
          'A discrepancy between the control position of the curtain and the internal position of the curtain macro was found 🚨 🪟',
        );

        logger.info('All curtains will be updated according to the internal state of the curtain macro 👷‍♂️ 🪟');
        logger.debug(this.getDebugContext({ positionFromControl: control?.value }));

        if (this.isBlocked(this.state.target)) {
          logger.info('Try to change position by (retry to apply next state) was blocked 🚫 😭');
          logger.debug(this.getDebugContext());

          continue;
        }

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
      logger.debug(this.getDebugContext({ allBlock: format(this.block.all, 'yyyy.MM.dd HH:mm:ss OOOO') }));
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
    logger.debug(this.getDebugContext({ allBlock: format(this.block.all, 'yyyy.MM.dd HH:mm:ss OOOO') }));
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

    // logger.info('The output for change 🏃‍♀️‍➡️ position was computed 💻');
    // logger.debug(this.getDebugContext({ output: this.output }));

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
      logger.debug(this.getDebugContext({ topic, message }));

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    this.output.states = [];

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
      logger.debug(this.getDebugContext({ topic, message }));

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    this.output.positions = [];
  };

  protected destroy() {
    clearInterval(this.timer.timeBasedComputing);
    clearInterval(this.timer.computeMovingArrange);
    clearInterval(this.timer.requestPositions);
  }
}

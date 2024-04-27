/* eslint-disable for-direction */
/* eslint-disable prefer-const */
/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable unicorn/no-empty-file */
import { addMinutes, compareAsc, format, subMinutes } from 'date-fns';
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../../control-type';
import { HyperionDevice } from '../../hyperion-device';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:cover');

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
 * Состояние крышки, в терминах макроса.
 */
export enum CoverState {
  UNDEFINED = 'UNDEFINED',
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  STOP = 'STOP',
}

/**
 * Позволяет остановить или продолжить вычисление.
 */
export enum Computation {
  CONTINUE = 'CONTINUE',
  STOP = 'STOP',
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
export type CoverMacrosSettings = {
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
      readonly open: string;

      /**
       * Выбирается пользователем из enum который предоставляет устройство.
       */
      readonly close: string;

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
export type CoverMacrosPublicState = {
  /**
   * Положение шторы, от 0 до 100.
   *
   * По умолчанию 100 - открыто, 0 - закрыто.
   *
   * Реверс настраивается на самом устройстве, а так же можно
   * выполнить реверс через настройки, путем указания параметров
   * CoverMacrosSettings.position.open и
   * CoverMacrosSettings.position.close
   *
   * Возможно для каждой шторы задать значение открытого и
   * закрытого положения, исходя из этого макросу будет понятно, в
   * каком направлении двигать штору.
   *
   * Нужно иметь в виду, что при подключении привода, ему нужно
   * указать где начало и где границы открывания/закрывания, а так
   * же направление, и желательно задавать значение по умолчанию.
   */
  prevCoverState: CoverState;
  coverState: CoverState;
  position: number;
};

type CoverMacrosPrivateState = {
  running: boolean;
  lighting: Lighting;
  illumination: number;
  motion: number;
  noise: number;
  temperature: number;
};

type CoverMacrosState = CoverMacrosPublicState & CoverMacrosPrivateState;

/**
 * ! OUTPUT
 */
/**
 * В результате макрос решает, каким способом по влиять на крышку
 * указать положение через position, либо задать state чтобы контроллер крышки
 * сделал всю работу, и полностью открыл, закрыл, остановил крышку.
 */
type CoverMacrosOutput = {
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

type CoverMacrosParameters = MacrosParameters<string, string | undefined>;

export class CoverMacros extends Macros<MacrosType.COVER, CoverMacrosSettings, CoverMacrosState> {
  private output: CoverMacrosOutput;

  private last = {
    motion: subMinutes(new Date(), 60),
    noise: subMinutes(new Date(), 60),
  };

  private block = {
    open: new Date(),
    close: new Date(),
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
    clock: NodeJS.Timeout;
    movingArrange: NodeJS.Timeout;
  };

  private movingArrange: {
    sum: number;
    avg: number;
    width: Date;
    stack: Array<{ date: Date; value: number }>;
  };

  constructor(parameters: CoverMacrosParameters) {
    const settings = CoverMacros.parseSettings(parameters.settings, parameters.version);
    const state = CoverMacros.parseState(parameters.state);

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

      state: defaultsDeep(state, {
        prevCoverState: CoverState.UNDEFINED,
        coverState: CoverState.UNDEFINED,
        position: -1,
        running: false,
        lighting: Lighting.OFF,
        illumination: -1,
        motion: -1,
        noise: -1,
        temperature: -1,
      }),

      devices: parameters.devices,
      controls: parameters.controls,

      collectingThrottleMs: 1000,
    });

    this.output = {
      states: [],
      positions: [],
    };

    this.movingArrange = {
      sum: 0,
      avg: 0,
      width: subMinutes(new Date(), 5),
      stack: [],
    };

    this.timer = {
      clock: setInterval(this.clock, 60 * 1000),
      movingArrange: setInterval(this.computeMovingArrange, 60 * 1000),
    };

    this.skip.firstButtonChange = cloneDeep(this.settings.devices.buttons);
  }

  static parseSettings = (settings: string, version: number = VERSION): CoverMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): CoverMacrosState => {
    if (!state) {
      return {
        prevCoverState: CoverState.UNDEFINED,
        coverState: CoverState.UNDEFINED,
        position: -1,
        running: false,
        lighting: Lighting.OFF,
        illumination: -1,
        motion: -1,
        noise: -1,
        temperature: -1,
      };
    }

    return Macros.migrate(state, version, VERSION, [], 'state');
  };

  setState = (nextPublicStateJson: string): void => {
    const nextPublicState = CoverMacros.parseState(nextPublicStateJson, this.version);

    logger('The next state was appeared ⏭️ ⏭️ ⏭️');
    logger(
      stringify({
        name: this.name,
        nextPublicState,
        state: this.state,
      }),
    );

    this.state.prevCoverState = this.state.coverState;
    this.state.coverState = nextPublicState.coverState;
    this.state.position = nextPublicState.position;

    logger('The next state was applied by set state in manual mode ⏭️ ✅ ⏭️');
    logger(stringify({ name: this.name, state: this.state }));

    for (const position of this.settings.devices.positions) {
      const controlType = ControlType.VALUE;
      const control = this.controls.get(getControlId(position));

      if (!control || control.type !== controlType || !control.topic) {
        logger('The position control specified in the settings was not found 🚨');
        logger(
          stringify({
            name: this.name,
            position,
            controlType,
            control,
          }),
        );

        continue;
      }

      const value = this.state.position;

      if (String(control.value) !== String(value)) {
        this.output.positions.push({ ...position, value });
      }
    }

    logger('The next output was computed for positions by set state in manual mode ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        state: this.state,
        output: this.output,
      }),
    );

    this.computeOutput();
    this.send();
  };

  private setCoverState(nextCoverState: CoverState) {
    const { position } = this.settings.properties;

    if (nextCoverState !== this.state.coverState) {
      this.state.prevCoverState = this.state.coverState;
      this.state.coverState = nextCoverState;

      if (this.state.coverState === CoverState.OPEN) {
        this.state.position = position.open;
      }

      if (this.state.coverState === CoverState.CLOSE) {
        this.state.position = position.close;
      }

      this.state.running = this.isRunning();

      logger('The next state was set ✅');
      logger({ name: this.name, state: this.state });
    }
  }

  protected collecting() {
    this.collectPosition();
    this.collectLightings();
    this.collectIllumination();
    this.collectMotion();
    this.collectNoise();
    this.collectTemperature();

    // logger('The collecting completed ✅');
    // logger(stringify({ state: this.state }));
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

  private get isCoverOpen(): boolean {
    const { position, state } = this.settings.properties;

    const { coverState, running } = this.state;

    return this.state.position === position.open && coverState === state.open && !running;
  }

  private get isCoverClose(): boolean {
    const { position, state } = this.settings.properties;

    const { coverState, running } = this.state;

    return this.state.position === position.close && coverState === state.close && !running;
  }

  private get isIlluminationReady() {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (low.closeLux > low.openLux) {
      logger('The low.closeLux should be less then low.openLux 🚨');
    }

    if (low.openLux > hi.openLux) {
      logger('The low.openLux should be less then hi.openLux 🚨');
    }

    if (hi.openLux > hi.closeLux) {
      logger('The hi.openLux should be less then hi.closeLux 🚨');
    }

    return (
      illumination > 0 &&
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
      logger('The closeBySun.illumination.closeLux should be more then closeBySun.illumination.openLux 🚨');
      logger(
        stringify({
          name: this.name,
        }),
      );
    }

    return (
      temperature > 0 &&
      closeBySun.temperature > 0 &&
      temperature > closeBySun.temperature &&
      closeBySun.illumination.closeLux > 0 &&
      closeBySun.illumination.openLux > 0 &&
      closeBySun.illumination.closeLux > closeBySun.illumination.openLux
    );
  }

  private get isCloseByLighting(): boolean {
    const { lighting } = this.state;

    return lighting === Lighting.ON;
  }

  private get isEnoughLightingToClose(): boolean {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (this.isIlluminationReady) {
      /**
       * Решение принимается при открытой шторе, при закрытой шторе и включенном освещении.
       */
      const isEnoughToCloseByLow = illumination <= low.closeLux;

      /**
       * Решение принимается при открытой шторе
       */
      const isEnoughToCloseByHi = illumination >= hi.closeLux && this.isCoverOpen;

      return isEnoughToCloseByLow || isEnoughToCloseByHi;
    }

    return false;
  }

  private get isEnoughSunActiveToClose(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination >= closeBySun.illumination.closeLux &&
      /**
       * Решение принимается при открытой шторе
       */
      this.isCoverOpen
    );
  }

  private get isEnoughSunActiveToOpen(): boolean {
    const { closeBySun } = this.settings.properties;

    const { illumination } = this.state;

    return (
      this.isCloseBySunReady &&
      illumination <= closeBySun.illumination.openLux &&
      /**
       * Решение принимается при закрытой шторе
       */
      this.isCoverClose
    );
  }

  private get isEnoughLightingToOpen(): boolean {
    const { low, hi } = this.settings.properties.illumination;
    const { illumination } = this.state;

    if (this.isIlluminationReady && this.isCoverClose) {
      return illumination >= low.openLux && illumination <= hi.openLux;
    }

    return false;
  }

  private get hasOpenBlock(): boolean {
    return compareAsc(this.block.open, new Date()) === 1;
  }

  private get hasCloseBlock(): boolean {
    return compareAsc(this.block.close, new Date()) === 1;
  }

  private isRunning(): boolean {
    const { positions } = this.settings.devices;

    return positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        return String(control.value) !== String(this.state.position);
      }

      return false;
    });
  }

  private collectPosition = () => {
    const { positions } = this.settings.devices;
    const { position: positionSettings, state: stateSettings } = this.settings.properties;

    let position = 0;

    for (const item of positions) {
      const control = this.controls.get(getControlId(item));

      if (control) {
        const value = Number(control.value);

        if (!Number.isInteger(value)) {
          logger('Skip cover state and position was initialization, because value is not integer ⏭️');
          logger(stringify({ name: this.name }));

          return;
        }

        position += value;
      } else {
        logger('Skip cover state and position was initialization, because control is not available ⏭️');
        logger(stringify({ name: this.name }));

        return;
      }
    }

    position /= positions.length;

    let coverState = CoverState.UNDEFINED;

    if (position === positionSettings.open) {
      coverState = CoverState.OPEN;
    }

    if (position === positionSettings.close) {
      coverState = CoverState.CLOSE;
    }

    if (position > 0 && position < 100) {
      coverState = CoverState.CLOSE;
    }

    if (
      this.state.prevCoverState === CoverState.UNDEFINED ||
      this.state.coverState === CoverState.UNDEFINED ||
      this.state.position === -1
    ) {
      logger('The cover state and position was initialized 🚀');
      logger({ name: this.name, position, coverState, positionSettings, state: this.state });

      this.state.prevCoverState = coverState;
      this.state.coverState = coverState;
      this.state.position = position;

      logger({ state: this.state });

      logger('Initializing the initial state as open 📖');
      logger(stringify({ name: this.name }));

      this.setState(JSON.stringify({ coverState: stateSettings.open, position: positionSettings.open }));
    } else {
      const running = this.isRunning();

      if (this.state.running !== running) {
        logger('The running was detected ⛹️‍♀️');

        this.state.running = running;

        logger(stringify({ name: this.name, state: this.state }));
      }
    }
  };

  private collectLightings = () => {
    const { lightings } = this.settings.devices;

    const isLightingOn = lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      return control?.value === control?.on;
    });

    this.state.lighting = isLightingOn ? Lighting.ON : Lighting.OFF;
  };

  private collectIllumination = () => {
    const { illuminations } = this.settings.devices;
    const { illumination } = this.settings.properties;

    if (this.state.lighting === Lighting.OFF) {
      this.state.illumination = this.computeMovingArrange(
        this.getValueByDetection(illuminations, illumination.detection),
      );
    }

    if (this.state.lighting === Lighting.ON) {
      this.state.illumination = this.getValueByDetection(illuminations, illumination.detection);
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

  protected priorityComputation = () => {
    return false;
  };

  protected computation = (current?: HyperionDevice) => {
    const previousCoverState = this.state.coverState;

    this.switching(current);
    this.sensors();

    if (previousCoverState !== this.state.coverState) {
      this.computeOutput();
      this.send();
    }
  };

  /**
   * Проверка наличия блокировок.
   */
  private isBlocked = (nextCoverState: CoverState): boolean => {
    const { blocks } = this.settings.properties;

    const hasBlockByTimeRange = blocks.some(({ type, fromMin, toMin }) => {
      if (this.hasHourOverlap(fromMin, toMin, 'min')) {
        if (nextCoverState === CoverState.OPEN && (type === BlockType.OPEN || type === BlockType.ALL)) {
          return true;
        }

        if (nextCoverState === CoverState.CLOSE && (type === BlockType.CLOSE || type === BlockType.ALL)) {
          return true;
        }
      }

      return false;
    });

    if (hasBlockByTimeRange) {
      return true;
    }

    if (nextCoverState === CoverState.OPEN && this.hasOpenBlock) {
      return true;
    }

    if (nextCoverState === CoverState.CLOSE && this.hasCloseBlock) {
      return true;
    }

    return false;
  };

  private isButtonChange(current?: HyperionDevice): boolean {
    if (!current) {
      return false;
    }

    const { buttons } = this.settings.devices;

    const isButtonChange = buttons.some(({ deviceId, controlId, controlType }) =>
      current.controls.find(
        (control) => current.id === deviceId && control.id === controlId && control.type === controlType,
      ),
    );

    if (isButtonChange && this.skip.firstButtonChange.length > 0) {
      logger('The first button change was skipped ⏭️');
      logger(
        stringify({
          name: this.name,
          isButtonChange,
          buttons,
          skip: this.skip.firstButtonChange,
        }),
      );

      this.skip.firstButtonChange = this.skip.firstButtonChange.filter(
        ({ deviceId, controlId, controlType }) =>
          !current.controls.some(
            (control) => current.id === deviceId && control.id === controlId && control.type === controlType,
          ),
      );

      logger(stringify({ skip: this.skip.firstButtonChange }));

      return false;
    }

    return isButtonChange;
  }

  /**
   * Автоматизация по переключателям.
   */
  private switching = (current?: HyperionDevice): void => {
    const { switcher, illumination } = this.settings.properties;

    let isSwitchHasBeenChange = false;

    if (switcher.trigger === Trigger.UP) {
      isSwitchHasBeenChange = this.isSwitchHasBeenUp();

      if (isSwitchHasBeenChange) {
        logger('The switch was closed 🔒');
        logger(stringify({ name: this.name }));
      }
    }

    if (switcher.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      if (isSwitchHasBeenChange) {
        logger('The switch was open 🔓');
        logger(stringify({ name: this.name }));
      }
    }

    if (this.isButtonChange(current)) {
      isSwitchHasBeenChange = true;

      logger('The button was touched 👉 🔘');
      logger(stringify({ name: this.name }));
    }

    if (isSwitchHasBeenChange) {
      let nextCoverState: CoverState = this.state.coverState;

      switch (this.state.coverState) {
        /**
         * Состояние в котором происходит движение к открыванию или уже открыто.
         */
        case CoverState.OPEN: {
          this.state.prevCoverState = CoverState.OPEN;

          nextCoverState = this.state.running ? CoverState.STOP : CoverState.CLOSE;

          break;
        }

        /**
         * Состояние в котором происходит движение к закрыванию или уже закрыто.
         */
        case CoverState.CLOSE: {
          this.state.prevCoverState = CoverState.CLOSE;

          nextCoverState = this.state.running ? CoverState.STOP : CoverState.OPEN;

          break;
        }

        /**
         * Состояние в котором крышка остановлена в неком среднем положении.
         * После остановки, нужно двигаться в противоположном направлении.
         */
        case CoverState.STOP: {
          if (this.state.prevCoverState === CoverState.OPEN) {
            nextCoverState = CoverState.CLOSE;

            break;
          }

          if (this.state.prevCoverState === CoverState.CLOSE) {
            nextCoverState = CoverState.OPEN;

            break;
          }

          break;
        }

        default: {
          logger('No handler found for the cover state 🚨');
          logger(stringify({ name: this.name, state: this.state }));
        }
      }

      logger(stringify({ name: this.name, nextCoverState, state: this.state }));

      if (this.state.coverState !== nextCoverState) {
        logger('The next state was obtained by switch 🎚️ 🎛️');

        const isLowPrioritySwitcher = switcher.type === SwitchType.SEALED_CONTACT || switcher.type === SwitchType.RELAY;

        logger(stringify({ name: this.name, isLowPrioritySwitcher }));

        /**
         * Запрет переключения, по средством геркона, реле или других
         * низко приоритетных переключателей, при наличии блокировок.
         *
         * ! Реализация приоритета блокировок.
         */
        if (isLowPrioritySwitcher && this.isBlocked(nextCoverState)) {
          logger('Try to change cover state was blocked 🚫 😭');
          logger(stringify({ name: this.name, state: this.state }));

          return;
        }

        /**
         * Запрет открытия, в случае реакции на геркон, реле или другой низко
         * приоритетный переключатель, при недостаточной освещенности.
         *
         * ! Реализация приоритета достаточности освещенности.
         */
        let { blockMin } = switcher;

        if (isLowPrioritySwitcher && nextCoverState === CoverState.OPEN && !this.isEnoughLightingToOpen) {
          logger('The illumination is not enough to open by low priority switcher 🚫 😭');
          logger(stringify({ name: this.name, illumination, state: this.state }));

          return;
        }

        if (blockMin > 0) {
          if (nextCoverState === CoverState.OPEN || nextCoverState === CoverState.STOP) {
            this.block.close = addMinutes(new Date(), blockMin);

            logger('The close block was activated ✅');
            logger(
              stringify({
                name: this.name,
                closeBlock: format(this.block.close, 'yyyy.MM.dd HH:mm:ss OOOO'),
              }),
            );
          }

          if (nextCoverState === CoverState.CLOSE || nextCoverState === CoverState.STOP) {
            this.block.open = addMinutes(new Date(), blockMin);

            logger('The open block was activated ✅');
            logger(
              stringify({
                name: this.name,
                openBlock: format(this.block.open, 'yyyy.MM.dd HH:mm:ss OOOO'),
              }),
            );
          }
        }

        this.setCoverState(nextCoverState);
      }
    }
  };

  private hitTimeRange = (min: number) => {
    logger('A time range hit check has been started ⏱️');
    logger(stringify({ name: this.name, hour: min / 60, min }));

    if (min > 0 && min < 24 * 60) {
      const hours = this.getDateInClientTimeZone().getHours();
      const minutes = this.getDateInClientTimeZone().getMinutes();

      logger('The time for now ℹ️');

      const fromMin = hours * 60 + minutes - 5;
      const toMin = hours * 60 + minutes + 5;

      logger(stringify({ name: this.name, hours, minutes, fromMin, min, toMin }));

      if (min >= fromMin && min <= toMin) {
        logger('An occurrence in the time range was found 🔘 ✅');
        logger(stringify({ name: this.name, fromMin, min, toMin }));

        return true;
      }
    } else {
      logger('The time should be in day range 🏙️ 🚨');
    }
  };

  /**
   * Автоматизация по времени.
   */
  private clock = () => {
    let toClose = false;
    let toOpen = false;
    let blockMin = 0;

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

    for (const { direction, blockMin: block, timePointMin } of openCloseByTime) {
      if (toClose || toOpen) {
        break;
      }

      for (const min of timePointMin) {
        if (this.hitTimeRange(min)) {
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

    let nextCoverState = this.state.coverState;

    if (toOpen) {
      nextCoverState = CoverState.OPEN;
    }

    if (toClose) {
      nextCoverState = CoverState.CLOSE;
    }

    logger('The clock was run ⏰');
    logger(
      stringify({
        name: this.name,
        toClose,
        toOpen,
        blockMin,
        nextCoverState,
        state: this.state,
        isSilence: this.isSilence,
      }),
    );

    if (this.state.coverState !== nextCoverState) {
      /**
       * ! Реализация приоритета блокировок.
       */
      if (this.isBlocked(nextCoverState)) {
        logger('Try to change cover state by time was blocked 🚫 😭');
        logger({ name: this.name });

        return;
      }

      if (blockMin > 0) {
        this.block.close = addMinutes(new Date(), blockMin);

        logger('The close block was activated ✅');
        logger(
          stringify({
            name: this.name,
            closeBlock: format(this.block.close, 'yyyy.MM.dd HH:mm:ss OOOO'),
          }),
        );

        this.block.open = addMinutes(new Date(), blockMin);

        logger('The open block was activated ✅');
        logger(
          stringify({
            name: this.name,
            openBlock: format(this.block.open, 'yyyy.MM.dd HH:mm:ss OOOO'),
          }),
        );
      }

      logger('Switching has been performed at a given time point ✅');
      logger(
        stringify({
          name: this.name,
          nowInClientTz: format(this.getDateInClientTimeZone(), 'yyyy.MM.dd HH:mm:ss OOOO'),
          openCloseByTime: this.settings.properties.openCloseByTime,
          state: this.state,
        }),
      );

      this.setCoverState(nextCoverState);
      this.computeOutput();
      this.send();
    }
  };

  private computeMovingArrange = (value?: number): number => {
    if (typeof value === 'number' && value >= 0) {
      this.movingArrange.stack.push({ date: new Date(), value });
      this.movingArrange.sum += value;
      this.movingArrange.avg = this.movingArrange.sum / this.movingArrange.stack.length;

      return this.movingArrange.avg;
    }

    logger('The procedure for moving the moving average has been started 🛝');
    logger(
      stringify({
        name: this.name,
        sum: this.movingArrange.sum,
        avg: this.movingArrange.avg,
        width: this.movingArrange.width,
        stack: this.movingArrange.stack.length,
      }),
    );

    const stack = [];

    this.movingArrange.width = addMinutes(this.movingArrange.width, 1);
    this.movingArrange.sum = 0;
    this.movingArrange.avg = 0;

    for (let index = 0; index < this.movingArrange.stack.length; index++) {
      const item = this.movingArrange.stack[index];

      if (compareAsc(item.date, this.movingArrange.width) >= 0) {
        stack.push(item);
        this.movingArrange.sum += item.value;
        this.movingArrange.avg = this.movingArrange.sum / stack.length;
      }
    }

    this.movingArrange.stack = stack;

    logger(
      stringify({
        name: this.name,
        sum: this.movingArrange.sum,
        avg: this.movingArrange.avg,
        width: this.movingArrange.width,
        stack: this.movingArrange.stack.length,
      }),
    );

    return this.movingArrange.avg;
  };

  /**
   * Автоматизации по датчикам.
   */
  private sensors = () => {
    let nextCoverState = this.state.coverState;

    if (this.isCloseByLighting) {
      if (nextCoverState !== CoverState.CLOSE) {
        logger('Close because enabled lighting 💡');
        logger({ name: this.name });

        nextCoverState = CoverState.CLOSE;
      }
    } else if (this.isEnoughLightingToClose) {
      if (nextCoverState !== CoverState.CLOSE) {
        logger('Close because enough lighting to close 🌃 or 🌇');
        logger({ name: this.name });

        nextCoverState = CoverState.CLOSE;
      }
    } else if (this.isEnoughSunActiveToClose) {
      if (nextCoverState !== CoverState.CLOSE) {
        logger('Close because sun is active 🌅 🌇 🌞 🥵');
        logger({ name: this.name });

        nextCoverState = CoverState.CLOSE;
      }
    } else if (this.isEnoughSunActiveToOpen) {
      if (nextCoverState !== CoverState.OPEN) {
        logger('Close because sun is not active 🪭 😎 🆒');
        logger({ name: this.name });

        nextCoverState = CoverState.OPEN;
      }
    } else if (this.isEnoughLightingToOpen && !this.isSilence && nextCoverState !== CoverState.OPEN) {
      logger('Open because enough lighting to open 🌅 💡');
      logger({ name: this.name });

      nextCoverState = CoverState.OPEN;
    }

    if (nextCoverState !== this.state.coverState) {
      /**
       * ! Реализация приоритета блокировок.
       */
      if (this.isBlocked(nextCoverState)) {
        logger('Try to change cover state by sensors was blocked 🚫 😭');
        logger({ name: this.name });

        return;
      }

      logger({
        name: this.name,
        isSilence: this.isSilence,
        state: this.state,
        isCloseByLighting: this.isCloseByLighting,
        isEnoughLightingToClose: this.isEnoughLightingToClose,
        isEnoughSunActiveToClose: this.isEnoughSunActiveToClose,
        isEnoughSunActiveToOpen: this.isEnoughSunActiveToOpen,
        isEnoughLightingToOpen: this.isEnoughLightingToOpen && !this.isSilence,
      });

      this.setCoverState(nextCoverState);
    }
  };

  protected computeOutput = () => {
    const { state: stateSettings } = this.settings.properties;

    for (const state of this.settings.devices.states) {
      const controlType = ControlType.ENUM;
      const control = this.controls.get(getControlId(state));

      if (!control || control.type !== controlType || !control.topic) {
        logger('The state control specified in the settings was not found, or matches the parameters 🚨');
        logger(
          stringify({
            name: this.name,
            state,
            controlType,
            control,
          }),
        );

        continue;
      }

      let value = '';

      switch (this.state.coverState) {
        case CoverState.OPEN: {
          value = stateSettings.open;

          break;
        }
        case CoverState.CLOSE: {
          value = stateSettings.close;

          break;
        }
        case CoverState.STOP: {
          value = stateSettings.stop;

          break;
        }
        default: {
          logger('The state value was not defined 🚨');
          logger(
            stringify({
              name: this.name,
              state,
              stateSettings,
            }),
          );

          continue;
        }
      }

      /**
       * Пишем всегда, так как то что выдает устройство не всегда соответствует тому что декларировано в enum.
       */
      this.output.states.push({ ...state, value });
    }

    logger('The output was computed 🍋');
    logger(
      stringify({ name: this.name, state: this.state, output: this.output, devices: this.settings.devices.states }),
    );
  };

  protected send = () => {
    for (const state of this.output.states) {
      const hyperionDevice = this.devices.get(state.deviceId);
      const hyperionControl = this.controls.get(getControlId(state));

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        logger(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger(
          stringify({
            name: this.name,
            state,
            hyperionDevice,
            controlId: getControlId(state),
            hyperionControl,
            topic: hyperionControl?.topic,
          }),
        );

        continue;
      }

      const { topic } = hyperionControl;
      const message = state.value;

      logger('The message has been created and will be sent to the wirenboard controller ⬆️ 📟 📟 📟 ⬆️');
      logger(
        stringify({
          name: this.name,
          topic,
          message,
        }),
      );

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    for (const position of this.output.positions) {
      const hyperionDevice = this.devices.get(position.deviceId);
      const hyperionControl = this.controls.get(getControlId(position));

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        logger(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger(
          stringify({
            name: this.name,
            position,
            hyperionDevice,
            controlId: getControlId(position),
            hyperionControl,
            topic: hyperionControl?.topic,
          }),
        );

        continue;
      }

      const { topic } = hyperionControl;
      const message = String(position.value);

      logger('The message has been created and will be sent to the wirenboard controller ⬆️ 📟 📟 📟 ⬆️');
      logger(
        stringify({
          name: this.name,
          topic,
          message,
        }),
      );

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }

    this.output = {
      states: [],
      positions: [],
    };

    logger('The next output was clean 🧼');
    logger(stringify({ name: this.name, state: this.state, output: this.output }));
  };

  protected destroy() {
    clearInterval(this.timer.clock);
    clearInterval(this.timer.movingArrange);
  }

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.devices.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.devices.switchers);
  }
}

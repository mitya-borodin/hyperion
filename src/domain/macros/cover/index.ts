/* eslint-disable prefer-const */
/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable unicorn/no-empty-file */
import { addMinutes, compareAsc, format } from 'date-fns';
import debug from 'debug';
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
 * Позволяет указать пороги освещенности при переходе через которые изменяется
 * состояние шторы.
 *
 * Порог задается списком [{closeLux, openLux}], можно задать несколько пороговых
 * значений [{closeLux: 25, openLux: 150}, {closeLux: 3000, openLux: 300}].
 *
 * Если значение closeLux < openLux, то при освещении меньше (<) closeLux штора
 * будет закрываться, а при значении больше (>) openLux будет открываться.
 *
 * Если значение closeLux > openLux, то при освещении больше (>) closeLux штора
 * будет закрываться, а при значении меньше (<) openLux будет открываться.
 *
 * Значение closeLux указывается при открытой шторе.
 * Значение openLux указывается при закрытой шторе, в случае включенного
 * освещения, значение увеличивается в mul раза.
 * Значение mul задается дробным числом (float).
 *
 * Регулировка уровней освещенности, может производиться пользователем,
 * в процесс эксплуатации, чтобы учесть значения в разные
 * (солнечные, пасмурные, дождливые) дни.
 *
 * Приоритет отдается закрытию.
 *
 * Открывание блокируется полной тишиной.
 *
 * Например:
 * - Потемнело и в связи с этим стоит закрыть шторы, чтобы с улицы не было видно
 * происходящего внутри  [ при closeLux: 25 закрыть, при openLux: 150 открыть],
 * а как только солнце взойдет и освещение при закрытой шторе станет выше
 * уставки, можно пытаться открыть штору.
 *
 * - Солнце слишком яркое и/или светит на монитор, стоит закрыть окно, и
 * как только освещение упадет до нужного порога открыть штору [закрыть
 * при closeLux: 3000 при открытой шторе, открыть при openLux: 300 при
 * закрытой шторе ].
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
    }>;

    /**
     * Контрол позволяет увидеть положение шторы после окончания
     * движения, и задать то положение в которое должна прийти штора.
     */
    readonly positions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;

      /**
       * Значение при полностью открытом положении
       */
      readonly open: number;

      /**
       * Значение при полностью закрытом положении
       */
      readonly close: number;
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
     * Позволяет указать пороги освещенности при переходе через которые изменяется
     * состояние шторы.
     *
     * Порог задается списком [{closeLux, openLux}], можно задать несколько пороговых
     * значений [{closeLux: 25, openLux: 150}, {closeLux: 3000, openLux: 300}].
     *
     * Если значение closeLux < openLux, то при освещении меньше (<) closeLux штора
     * будет закрываться, а при значении больше (>) openLux будет открываться.
     *
     * Если значение closeLux > openLux, то при освещении больше (>) closeLux штора
     * будет закрываться, а при значении меньше (<) openLux будет открываться.
     *
     * Значение closeLux указывается при открытой шторе.
     * Значение openLux указывается при закрытой шторе, в случае включенного
     * освещения, значение увеличивается в mul раза.
     * Значение mul задается дробным числом (float).
     *
     * Регулировка уровней освещенности, может производиться пользователем,
     * в процесс эксплуатации, чтобы учесть значения в разные
     * (солнечные, пасмурные, дождливые) дни.
     *
     * Приоритет отдается закрытию.
     *
     * Открывание блокируется полной тишиной.
     *
     * Например:
     * - Потемнело и в связи с этим стоит закрыть шторы, чтобы с улицы не было видно
     * происходящего внутри  [ при closeLux: 25 закрыть, при openLux: 150 открыть],
     * а как только солнце взойдет и освещение при закрытой шторе станет выше
     * уставки, можно пытаться открыть штору.
     *
     * - Солнце слишком яркое и/или светит на монитор, стоит закрыть окно, и
     * как только освещение упадет до нужного порога открыть штору [закрыть
     * при closeLux: 3000 при открытой шторе, открыть при openLux: 300 при
     * закрытой шторе ].
     */
    readonly illumination: {
      readonly detection: LevelDetection;
      readonly boundaries: Array<{ closeLux: number; openLux: number }>;
      readonly mul: number;
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
      readonly illumination: number;
      readonly temperature: number;
    };
  };
};

/**
 * ! STATE
 */
export type CoverMacrosPublicState = {
  /**
   * Текущее состояние крышки.
   */
  cover: CoverState;

  /**
   * Предыдущее состояние крышки.
   */
  prevCover: CoverState;

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
  position: number;
};

type CoverMacrosPrivateState = {
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
type CoverMacrosNextOutput = {
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
  private nextOutput: CoverMacrosNextOutput;

  private last = {
    motion: new Date(),
    noise: new Date(),
  };

  private block = {
    open: new Date(),
    close: new Date(),
  };

  private timer: NodeJS.Timeout;

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
        prevCover: CoverState.STOP,
        state: CoverState.STOP,
        position: -1,
        lighting: Lighting.OFF,
        illumination: -1,
        motion: -1,
        noise: -1,
        temperature: -1,
      }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      states: [],
      positions: [],
    };

    this.timer = setInterval(this.clock, 60 * 1000);
  }

  static parseSettings = (settings: string, version: number = VERSION): CoverMacrosSettings => {
    return Macros.migrate(settings, version, VERSION, [], 'settings');
  };

  static parseState = (state?: string, version: number = VERSION): CoverMacrosState => {
    if (!state) {
      return {
        prevCover: CoverState.STOP,
        cover: CoverState.STOP,
        position: 100,
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
        currentState: this.state,
      }),
    );

    this.state.cover = nextPublicState.cover;
    this.state.position = nextPublicState.position;

    logger('The next state was applied ⏭️ ✅ ⏭️');
    logger(
      stringify({
        name: this.name,
        state: this.state,
      }),
    );

    this.output();

    if (this.nextOutput.states.length > 0 || this.nextOutput.positions.length > 0) {
      logger('The public state was determined 🫡 🚀');
      logger(
        stringify({
          name: this.name,
          state: this.state,
          nextOutput: this.nextOutput,
        }),
      );
    }

    this.send();
  };

  protected collecting() {
    this.collectCover();
    this.collectLightings();
    this.collectIllumination();
    this.collectMotion();
    this.collectNoise();
    this.collectTemperature();
  }

  private get isIlluminationReady() {
    const { boundaries, mul } = this.settings.properties.illumination;
    const { illumination } = this.state;

    return (
      illumination > 0 &&
      boundaries.some(({ closeLux, openLux }) => {
        if (closeLux < 0 || openLux < 0) {
          return false;
        }

        return false;
      }) &&
      mul > 0
    );
  }

  private get isEnoughLightingToOpen(): boolean {
    /**
     * Реализация приоритета закрывания.
     */
    if (this.isEnoughLightingToClose) {
      return false;
    }

    const { boundaries, mul } = this.settings.properties.illumination;
    const { lighting, illumination } = this.state;

    if (this.isIlluminationReady) {
      return boundaries.some(({ closeLux, openLux }) => {
        if (openLux > closeLux) {
          return illumination >= openLux * (lighting === Lighting.ON ? mul : 1);
        }

        if (closeLux > openLux) {
          return illumination <= openLux * (lighting === Lighting.ON ? mul : 1);
        }

        return false;
      });
    }

    return false;
  }

  private get isEnoughLightingToClose(): boolean {
    const { boundaries, mul } = this.settings.properties.illumination;
    const { lighting, illumination } = this.state;

    if (this.isIlluminationReady) {
      return boundaries.some(({ closeLux, openLux }) => {
        if (openLux > closeLux) {
          return illumination <= closeLux * (lighting === Lighting.ON ? mul : 1);
        }

        if (closeLux > openLux) {
          return illumination >= closeLux;
        }

        return false;
      });
    }

    return false;
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

  private get isSunActive(): boolean {
    const { closeBySun } = this.settings.properties;
    const { illumination, temperature } = this.state;

    return (
      closeBySun.illumination > 0 &&
      closeBySun.temperature > 0 &&
      illumination > 0 &&
      temperature > 0 &&
      illumination > closeBySun.illumination &&
      temperature > closeBySun.temperature &&
      this.isSilence
    );
  }

  private get hasOpenBlock(): boolean {
    return compareAsc(this.block.open, new Date()) === 1;
  }

  private get hasCloseBlock(): boolean {
    return compareAsc(this.block.close, new Date()) === 1;
  }

  private collectCurrentCover = () => {
    const { states, positions } = this.settings.devices;

    const isSomeCoverOpen = states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.open;
      }

      return false;
    });

    const isSomeCoverClose = states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.close;
      }

      return false;
    });

    const isSomeCoverStop = states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.stop;
      }

      return false;
    });

    const isSomePositionOpen = positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        return Number(control.value) === position.open;
      }

      return false;
    });

    const isSomePositionClose = positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        return Number(control.value) === position.close;
      }

      return false;
    });

    const isSomePositionStop = positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        const value = Number(control.value);

        if (position.open > position.close && value >= position.close && value <= position.open) {
          return true;
        }

        if (position.close > position.open && value >= position.open && value <= position.close) {
          return true;
        }
      }

      return false;
    });

    return {
      isSomeOpen: isSomeCoverOpen || isSomePositionOpen,
      isSomeClose: isSomeCoverClose || isSomePositionClose,
      isSomeStop: isSomeCoverStop || isSomePositionStop,
      isSomeCoverOpen,
      isSomeCoverClose,
      isSomeCoverStop,
      isSomePositionOpen,
      isSomePositionClose,
      isSomePositionStop,
    };
  };

  private collectCover = () => {
    const { states, positions } = this.settings.devices;

    let nextCoverState = CoverState.STOP;

    const {
      isSomeOpen,
      isSomeClose,
      isSomeStop,
      isSomeCoverOpen,
      isSomeCoverClose,
      isSomeCoverStop,
      isSomePositionOpen,
      isSomePositionClose,
      isSomePositionStop,
    } = this.collectCurrentCover();

    if (isSomeOpen) {
      nextCoverState = CoverState.OPEN;
    } else if (isSomeClose) {
      nextCoverState = CoverState.CLOSE;
    }

    if (this.state.cover === nextCoverState) {
      return;
    }

    logger('The cover internal state has been changed 🍋');
    logger(
      stringify({
        name: this.name,
        isSomeOpen,
        isSomeClose,
        isSomeStop,
        isSomeCoverOpen,
        isSomeCoverClose,
        isSomeCoverStop,
        isSomePositionOpen,
        isSomePositionClose,
        isSomePositionStop,
        nextCoverState,
        states: states.map((state) => {
          return {
            value: this.controls.get(getControlId(state))?.value,
          };
        }),
        positions: positions.map((position) => {
          return {
            value: this.controls.get(getControlId(position))?.value,
          };
        }),
        state: this.state,
      }),
    );

    this.state.cover = nextCoverState;

    /**
     * Записываем среднее значение позиции если в нашем сетапе некоторые шторы
     * находятся в промежуточном положении.
     *
     * Это значение пользователь может изменить при помощи какого-либо
     * способа управления (web gui, Apple Home Kit, Android Home, Home Assistant,
     * Яндекс Алиса, Apple Siri).
     */
    this.state.position = positions.reduce((accumulator, position, currentIndex, positions) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        if (positions.length - 1 === currentIndex) {
          return (accumulator + Number(control.value)) / positions.length;
        }

        return accumulator + Number(control.value);
      }

      return accumulator;
    }, 0);
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

    this.state.illumination = this.getValueByDetection(illuminations, illumination.detection);
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
    const previousCoverState = this.state.cover;

    this.switching(current);
    this.sensors();

    if (previousCoverState !== this.state.cover) {
      this.output();
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

    return buttons.some(({ deviceId, controlId, controlType }) =>
      current.controls.find(
        (control) => current.id === deviceId && control.id === controlId && control.type === controlType,
      ),
    );
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
      }
    }

    if (switcher.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      if (isSwitchHasBeenChange) {
        logger('The switch was open 🔓');
      }
    }

    if (this.isButtonChange(current)) {
      isSwitchHasBeenChange = true;

      logger('The button was touched 👉 🔘');
    }

    if (isSwitchHasBeenChange) {
      logger(stringify({ name: this.name, state: this.state }));

      let nextCoverState: CoverState = this.state.cover;

      switch (this.state.cover) {
        /**
         * Состояние в котором происходит движение к открыванию.
         */
        case CoverState.OPEN: {
          nextCoverState = CoverState.STOP;

          this.state.prevCover = CoverState.OPEN;

          break;
        }
        /**
         * Состояние в котором происходит движение к закрыванию.
         */
        case CoverState.CLOSE: {
          nextCoverState = CoverState.STOP;

          this.state.prevCover = CoverState.CLOSE;

          break;
        }
        /**
         * Состояние в котором крышка остановлена в неком среднем положении.
         * После остановки, нужно двигаться в противоположном направлении.
         */
        case CoverState.STOP: {
          if (this.state.prevCover === CoverState.OPEN) {
            nextCoverState = CoverState.CLOSE;
          }

          if (this.state.prevCover === CoverState.CLOSE) {
            nextCoverState = CoverState.OPEN;
          }

          break;
        }
        default: {
          logger('No handler found for the cover state 🚨');
          logger(stringify({ name: this.name, state: this.state }));

          nextCoverState = CoverState.CLOSE;
        }
      }

      if (this.state.cover !== nextCoverState) {
        const isLowPrioritySwitcher = switcher.type === SwitchType.SEALED_CONTACT || switcher.type === SwitchType.RELAY;

        /**
         * Запрет переключения, по средством геркона, реле или других
         * низко приоритетных переключателей, при наличии блокировок.
         *
         * ! Реализация приоритета блокировок.
         */
        if (isLowPrioritySwitcher && this.isBlocked(nextCoverState)) {
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
          logger('The illumination is not enough to open by low priority switcher 🚫');
          logger(
            stringify({
              name: this.name,
              illumination,
              state: this.state,
            }),
          );

          return;
        }

        if (blockMin > 0) {
          if (nextCoverState === CoverState.OPEN) {
            this.block.close = addMinutes(new Date(), blockMin);

            logger('The close block was activated ✅');
            logger(
              stringify({
                name: this.name,
                closeBlock: format(this.block.close, 'yyyy.MM.dd HH:mm:ss OOOO'),
              }),
            );
          }

          if (nextCoverState === CoverState.CLOSE) {
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

        this.state.cover = nextCoverState;
      }
    }
  };

  private hitTimeRange = (min: number) => {
    if (min > 0 && min < 24 * 60) {
      const hours = this.getDateInClientTimeZone().getHours();
      const minutes = this.getDateInClientTimeZone().getMinutes();

      const from = hours + minutes - 5;
      const to = hours + minutes + 5;

      if (from >= min && min <= to) {
        return true;
      }
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

    let nextCoverState = this.state.cover;

    if (toOpen) {
      nextCoverState = CoverState.OPEN;
    }

    if (toClose) {
      nextCoverState = CoverState.CLOSE;
    }

    if (this.state.cover !== nextCoverState) {
      /**
       * ! Реализация приоритета блокировок.
       */
      if (this.isBlocked(nextCoverState)) {
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

      this.state.prevCover = this.state.cover;
      this.state.cover = nextCoverState;

      this.output();
      this.send();
    }
  };

  /**
   * Автоматизации по датчикам.
   */
  private sensors = () => {
    let nextCoverState = this.state.cover;

    if (this.isEnoughLightingToOpen && !this.isSilence) {
      nextCoverState = CoverState.OPEN;
    }

    if (this.isEnoughLightingToClose) {
      nextCoverState = CoverState.CLOSE;
    }

    if (this.isSunActive) {
      nextCoverState = CoverState.CLOSE;
    }

    if (nextCoverState !== this.state.cover) {
      /**
       * ! Реализация приоритета блокировок.
       */
      if (this.isBlocked(nextCoverState)) {
        return;
      }

      this.state.prevCover = this.state.cover;
      this.state.cover = nextCoverState;
    }
  };

  protected output = () => {
    const nextOutput: CoverMacrosNextOutput = {
      states: [],
      positions: [],
    };

    for (const state of this.settings.devices.states) {
      const controlType = ControlType.ENUM;
      const control = this.controls.get(getControlId(state));

      if (!control || control.type !== controlType || !control.topic) {
        logger('The control specified in the settings was not found, or matches the parameters 🚨');
        logger(
          stringify({
            name: this.name,
            state,
            controlType,
            controls: [...this.controls.values()],
          }),
        );

        continue;
      }

      let value = state.stop;

      if (this.state.cover === CoverState.OPEN) {
        value = state.open;
      }

      if (this.state.cover === CoverState.STOP) {
        value = state.stop;
      }

      if (this.state.cover === CoverState.CLOSE) {
        value = state.close;
      }

      if (control.value !== value) {
        nextOutput.states.push({ ...state, value });
      }
    }

    for (const position of this.settings.devices.positions) {
      const controlType = ControlType.ENUM;
      const control = this.controls.get(getControlId(position));

      if (!control || control.type !== controlType || !control.topic) {
        logger('The control specified in the settings was not found, or matches the parameters 🚨');
        logger(
          stringify({
            name: this.name,
            position,
            controlType,
            controls: [...this.controls.values()],
          }),
        );

        continue;
      }

      let value = 50;

      if (this.state.cover === CoverState.OPEN) {
        value = position.open;
      }

      if (this.state.cover === CoverState.CLOSE) {
        value = position.close;
      }

      if (control.value !== String(value)) {
        nextOutput.positions.push({ ...position, value });
      }
    }

    this.nextOutput = nextOutput;

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  };

  protected send = () => {
    for (const state of this.nextOutput.states) {
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

    for (const position of this.nextOutput.positions) {
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
  };

  protected destroy() {
    clearInterval(this.timer);
  }

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.devices.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.devices.switchers);
  }
}

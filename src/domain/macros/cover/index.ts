/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable unicorn/no-empty-file */
import { addMinutes, format } from 'date-fns';
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { getControlId } from '../get-control-id';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:cover');

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
 * Позволяет заблокировать изменение состояния шторы в заданном временном диапазоне.
 *
 * Возможно указать какое именно действие блокировать, [[OPEN, 23, 9], [CLOSE, 11,16], [ANY, 21-22]].
 *
 * Это полезно когда нужно приостановить выполнение автоматических функций.
 *
 * В случае когда мы не хотим открывать штору с ночи до определенно времени дня например гарантированно до
 * 10 дня, мы зададим [[OPEN, 0, 10]].
 * В случае когда мы гарантированно не хотим закрывать шторы в середине дня, мы зададим [[CLOSE, 11,16]].
 * В случае когда мы хотим запретить все автоматические действия, скажем перед сном [[ANY, 20,23]].
 *
 * В результате мы получим настройку [[OPEN, 0, 10], [CLOSE, 10,16], [ALL, 20,23]].
 *
 * Нужно понимать, что это специализированная настройка и за частую управление шторами
 * будет происходит по освещенности + движение и шум.
 *
 * * 2. Открыть/Закрыть/Остановить через кнопку либо через реальную либо через виртуальную.
 * Классический способ переключать состояние шторы, при котором нужно нажимать на кнопку.
 *
 * Способ является приоритетным над всеми остальными, и может выставлять блокировку на изменения
 *  состояния, на заданное время.
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
 * Позволяет начать открывать шторы при отрывании двери, окна, и других открывающихся конструкций.
 *
 * Может работать совместно с датчиком освещенности, и при превышении
 * указанной освещенности начинать открывать штору в момент срабатывания геркона.
 *
 * Например в случае открывания двери в котельную, в которой весит штора, открываем дверь,
 * и ждем пока откроется штора.
 *
 * Например утром (освещение выше уставки) при выходе из любой комнаты начинают открываться прихожая и гостиная.
 * Нужно понимать, что при каждом открывании двери будут срабатывать этот сценарий, пытающийся открыть шторы, но
 * его могут блокировать другие условия.
 *
 * * 4. Открыть/Закрыть по времени
 * Второй по приоритетности переключатель состояния после ручного нажатия на кнопку.
 *
 * Позволяет указать в какой час нужно изменить состояние шторы.
 *
 * Можно задать по действию на каждый час.
 *
 * {
 *   direction: "OPEN",
 *   blockMin: 2 * 60,
 *   mins: [1 * 60,4 * 60,6 * 60,8 * 60]
 * }
 * Штора будет пытаться открыться в час ночи, в 4, 6, 8
 * утра причем после каждой попытки будут блокироваться
 * автоматические действия на заданное время.
 *
 * {
 *  direction: "CLOSE",
 *  blockMin: 8 * 60,
 *  mins: [18 * 60,20 * 60,0 * 60]
 * }
 * Штора будет пытаться закрыться в 18, 20, 0, часов
 * причем после каждой попытки будут блокироваться автоматические
 * действия на заданное время.
 *
 * При пересечении времени, приоритет будет отдан операции CLOSE.
 *
 * * 5. Открыть/Закрыть по освещенности
 * Позволяет указать пороги освещенности после которых нужно изменить состояние шторы.
 *
 * Порог задается кортежем [CLOSE, OPEN], можно задать несколько пороговых значений [[25, 150], [3000, 300]].
 *
 * Если значение CLOSE < OPEN, то при освещении меньше (<) CLOSE штора будет закрываться,
 * а при значении больше (>) OPEN будет открываться.
 *
 * Если значение CLOSE > OPEN, то при освещении больше (>) CLOSE штора будет закрываться,
 * а при значении меньше (<) OPEN будет открываться.
 *
 * Нужно понимать, то, что когда штора закрыта, сила солнечного освещения сильно меньше, и при пусконаладке
 * нужно определить какое освещение при закрытой шторе будет подходящим для изменения состояния.
 *
 * Пуска наладку сложно сделать непосредственно в день окончания монтажа, по
 * этому пользователю будет выдана инструкция о том как регулировать значения освещенности.
 *
 * Приоритет отдается закрытию, проверяются все диапазоны, и если в каком либо есть закрытие, то случится оно.
 *
 * Например:
 * - Потемнело и в связи с этим стоит закрыть шторы, чтобы с улицы не было видно происходящего внутри
 *   [ при 25 закрыть, при 150 открыть], а как только солнце взойдет и освещение при закрытой шторе
 *   станет выше уставки, можно пытаться открыть штору.
 * - Солнце взошло или тучи рассеялись после сумерек, стоит открыть шторы для инсоляции помещения
 *   [ закрыть при 100 при открытой шторе, открыть при 150 при закрытой шторе].
 * - Солнце слишком яркое и/или светит на монитор, стоит закрыть окно, и как только освещение упадет
 *   до нужного порога открыть штору [закрыть при 3000 при открытой шторе, открыть при 300 при
 *   закрытой шторе ].
 *
 * * 6. Открывание/Закрывание по датчику движения и/или шуму.
 *  Дополняет изменение состояние шторы по освещенности, позволяет НЕ открывать шторы,
 *  пока не появится движение и/или шум, даже когда освещение достаточно для открывания.
 *
 *  Позволяет при достаточном освещении открыть шторы в нужных места при появлении движения
 *  либо шума на указанных датчиках, свыше указанных значений.
 *
 * * 7. Закрыть по солнечной активности или освещенности движению, шуму и температуре
 * В солнечные дни в комнату может проникать слишком много тепла от солнца
 * и эта автоматизация даст возможность прикрыть штору, если в помещении
 * выросла температура при высокой освещенности.
 *
 * Позволяет закрыть штору если освещенность выше установленного порога, установилась
 * полная тишина ни движения ни шума дольше заданного промежутка скажем 1 час,
 * температура выше заданной уставки.
 *
 * Позволяет закрыть штору не полностью, а прикрыть на нужную величину.
 */
export type CoverMacrosSettings = {
  /**
   * Включает в себя все типы переключателей, кнопки,
   *  виртуальные кнопки, герконы.
   */
  readonly switchers: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
  }>;

  /**
   * Группы освещения, возле датчика освещения.
   *
   * Позволяет понять, включено ли освещение.
   */
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

    /**
     * Уровень освещенности выше которого случится открывание шторы.
     *
     * Если указать значение меньше (<) 0 (например -1), то освещенность
     * учитываться не будет, и переключатель будет каждый раз
     * открывать штору.
     *
     * Если указать большое значение больше 100_000, то данный переключатель
     * никогда не откроет штору, так как значение освещенности
     * никогда не будет достигнуто.
     *
     * Имеет смысл опытным путем определить какое освещение достаточно
     * при закрытой шторе, чтобы открыть штору, нужно проверить
     * это значение и в пасмурный день.
     *
     * Если указаны группы освещения, то при включенном освещение
     * значение будет умножено на 2.
     */
    readonly illumination: number;
  };

  /**
   * Позволяет заблокировать изменение состояния шторы в заданном временном диапазоне.
   *
   * Возможно указать какое именно действие блокировать, [[OPEN, 23, 9], [CLOSE, 11,16], [ANY, 21-22]].
   *
   * Это полезно когда нужно приостановить выполнение автоматических функций.
   *
   * В случае когда мы не хотим открывать штору с ночи до определенно времени дня например гарантированно до
   * 10 дня, мы зададим [[OPEN, 0, 10]].
   * В случае когда мы гарантированно не хотим закрывать шторы в середине дня, мы зададим [[CLOSE, 11,16]].
   * В случае когда мы хотим запретить все автоматические действия, скажем перед сном [[ANY, 20,23]].
   *
   * В результате мы получим настройку [[OPEN, 0, 10], [CLOSE, 10,16], [ALL, 20,23]].
   *
   * Нужно понимать, что это специализированная настройка и за частую управление шторами
   * будет происходит по освещенности + движение и шум.
   */
  readonly blocks: [BlockType, number, number][];

  /**
   * Второй по приоритетности переключатель состояния после ручного
   * нажатия на кнопку.
   *
   * Позволяет указать в какой час нужно изменить состояние шторы.
   *
   * Можно задать по действию на каждый час.
   *
   * {
   *   direction: "OPEN",
   *   blockMin: 2 * 60,
   *   timePointMin: [1 * 60,4 * 60,6 * 60,8 * 60]
   * }
   * Штора будет пытаться открыться в час ночи, в 4, 6, 8
   * утра причем после каждой попытки будут блокироваться
   * автоматические действия на заданное время.
   *
   * {
   *  direction: "CLOSE",
   *  blockMin: 8 * 60,
   *  timePointMin: [18 * 60,20 * 60,0 * 60]
   * }
   * Штора будет пытаться закрыться в 18, 20, 0, часов
   * причем после каждой попытки будут блокироваться автоматические
   * действия на заданное время.
   *
   * При пересечении времени, приоритет будет отдан операции CLOSE.
   */
  readonly openCloseByTime: Array<{
    direction: OpenCloseByTimeDirection;
    blockMin: number;
    timePointMin: number[];
  }>;

  readonly illumination: {
    readonly detection: LevelDetection;

    /**
     * Диапазоны освещенности для закрывания и открывания шторы.
     *
     * Порог задается кортежем [CLOSE, OPEN], можно задать несколько
     * пороговых значений [[25, 150], [3000, 200], [300, 500]].
     *
     * Если значение CLOSE < OPEN, то при освещении меньше (<) CLOSE
     * штора будет закрываться, а при значении больше (>) OPEN будет
     * открываться.
     *
     * Если значение CLOSE > OPEN, то при освещении больше (>) CLOSE
     * штора будет закрываться, а при значении меньше (<) OPEN
     * будет открываться.
     *
     * Приоритет отдается закрытию.
     * Проверяются все диапазоны, и если в каком либо есть закрытие, то случится оно.
     *
     * Например:
     * - Потемнело и в связи с этим стоит закрыть шторы, чтобы с улицы не
     * было видно происходящего внутри [ при 25 закрыть, при 150 открыть],
     * а как только солнце взойдет и освещение при закрытой шторе станет
     * выше уставки, можно пытаться открыть штору.
     *
     * - Солнце взошло или тучи рассеялись после сумерек, стоит открыть шторы
     * для инсоляции помещения [ закрыть при 100 при открытой шторе, открыть
     * при 150 при закрытой шторе].
     *
     * - Солнце слишком яркое и/или светит на монитор, стоит закрыть окно, и
     * как только освещение упадет до нужного порога открыть штору
     * [закрыть при 3000 при открытой шторе, открыть при 300 при закрытой шторе ].
     */
    readonly boundaries: [number, number][];

    /**
     * Если true, то при полной тишине операция OPEN будет заблокирована до
     * нарушения тишины.
     */
    readonly blockTheOpenWhileFullSilent: boolean;
  };

  readonly motion: {
    readonly detection: LevelDetection;

    /**
     * Задает чувствительность к движению.
     */
    readonly trigger: number;

    /**
     * Значение освещенности, превышение которого позволяет открывать
     * штору при появлении движения.
     */
    readonly illumination: number;
  };

  readonly noise: {
    readonly detection: LevelDetection;

    /**
     * Задает чувствительность к шуму.
     */
    readonly trigger: number;

    /**
     * Значение освещенности, превышение которого позволяет открывать
     * штору при появлении шума.
     */
    readonly illumination: number;
  };

  readonly temperature: {
    readonly detection: LevelDetection;
  };

  /**
   * Определение полной тишины.
   *
   * Значение задается в минутах.
   *
   * Если > 0, то в случае отсутствия шума и движения группа
   * будет активен фактор закрытия по движению и шуму.
   *
   * Если указать <= 0, то фактор закрывания по шуму и движению
   * отключается.
   */
  readonly silenceMin: number;

  /**
   * Автоматическое закрытие шторы, по высокой солнечной
   * активности.
   */
  readonly closeBySun: {
    /**
     * Если освещенность выше заданного порога, то активируется закрытие/открытие
     * шторы по солнцу.
     */

    readonly illumination: number;
    /**
     * Если температура превысила уставку и установилась полная тишина,
     * то штора закрывается до указанного положения.
     */

    readonly temperature: number;
    /**
     * Определение полной тишины.
     *
     * Значение задается в минутах.
     *
     * Если > 0, то в случае отсутствия шума и движения группа
     * будет активен фактор закрытия по движению и шуму.
     *
     * Если указать <= 0, то фактор закрывания по шуму и движению
     * отключается.
     */
    readonly silenceMin: number;

    readonly position: number;
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
    all: new Date(),
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

  private collectCurrentCover = () => {
    const isSomeCoverOpen = this.settings.states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.open;
      }

      return false;
    });

    const isSomeCoverClose = this.settings.states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.close;
      }

      return false;
    });

    const isSomeCoverStop = this.settings.states.some((state) => {
      const control = this.controls.get(getControlId(state));

      if (control) {
        return control.value === state.stop;
      }

      return false;
    });

    const isSomePositionOpen = this.settings.positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        return Number(control.value) === position.open;
      }

      return false;
    });

    const isSomePositionClose = this.settings.positions.some((position) => {
      const control = this.controls.get(getControlId(position));

      if (control) {
        return Number(control.value) === position.close;
      }

      return false;
    });

    const isSomePositionStop = this.settings.positions.some((position) => {
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
        states: this.settings.states.map((state) => {
          return {
            value: this.controls.get(getControlId(state))?.value,
          };
        }),
        positions: this.settings.positions.map((position) => {
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
    this.state.position = this.settings.positions.reduce((accumulator, position, currentIndex, positions) => {
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
    const isLightingOn = this.settings.lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      return control?.value === control?.on;
    });

    this.state.lighting = isLightingOn ? Lighting.ON : Lighting.OFF;
  };

  private collectIllumination = () => {
    this.state.illumination = this.getValueByDetection(
      this.settings.illuminations,
      this.settings.illumination.detection,
    );
  };

  private collectMotion = () => {
    this.state.motion = this.getValueByDetection(this.settings.motions, this.settings.motion.detection);

    if (this.state.motion >= this.settings.motion.trigger) {
      this.last.motion = new Date();
    }
  };

  private collectNoise = () => {
    this.state.noise = this.getValueByDetection(this.settings.noises, this.settings.noise.detection);

    if (this.state.noise >= this.settings.noise.trigger) {
      this.last.noise = new Date();
    }
  };

  private collectTemperature = () => {
    this.state.temperature = this.getValueByDetection(this.settings.temperatures, this.settings.temperature.detection);
  };

  protected priorityComputation = () => {
    return false;
  };

  protected computation = () => {
    const previousCoverState = this.state.cover;

    const computation = this.switching();

    if (computation === Computation.CONTINUE) {
      this.sensors();
    }

    if (previousCoverState !== this.state.cover) {
      this.output();
      this.send();
    }
  };

  /**
   * Проверка наличия блокировок по времени.
   */
  private isBlockedByTimeRange = (nextCoverState: CoverState): boolean => {
    return this.settings.blocks.some(([type, from, to]) => {
      if (this.hasHourOverlap(from, to)) {
        if (nextCoverState === CoverState.OPEN && (type === BlockType.OPEN || type === BlockType.ALL)) {
          return true;
        }

        if (nextCoverState === CoverState.CLOSE && (type === BlockType.CLOSE || type === BlockType.ALL)) {
          return true;
        }
      }

      return false;
    });
  };

  /**
   * Автоматизация по переключателям.
   */
  private switching = (): Computation => {
    const { switcher: settings } = this.settings;

    let isSwitchHasBeenChange = false;

    if (settings.trigger === Trigger.UP) {
      isSwitchHasBeenChange = this.isSwitchHasBeenUp();

      if (isSwitchHasBeenChange) {
        logger('The switch was closed 🔒');
      }
    }

    if (settings.trigger === Trigger.DOWN) {
      isSwitchHasBeenChange = this.isSwitchHasBeenDown();

      if (isSwitchHasBeenChange) {
        logger('The switch was open 🔓');
      }
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
        const isLowPrioritySwitcher = settings.type === SwitchType.SEALED_CONTACT || settings.type === SwitchType.RELAY;

        /**
         * Запрет переключения, по средством геркона, реле или других
         * низко приоритетных переключателей, при наличии блокировок.
         */
        if (isLowPrioritySwitcher && this.isBlockedByTimeRange(nextCoverState)) {
          return Computation.STOP;
        }

        /**
         * Запрет открытия, в случае реакции на геркон, реле или другой низко
         * приоритетный переключатель, при недостаточной освещенности.
         */
        // eslint-disable-next-line prefer-const
        let { illumination, blockMin } = settings;

        /**
         * В случае включенного освещения, стоит умножить значение освещенности на 2.
         */
        if (this.state.lighting === Lighting.ON) {
          illumination *= 2;
        }

        if (
          isLowPrioritySwitcher &&
          illumination > 0 &&
          this.state.illumination > 0 &&
          this.state.illumination < illumination &&
          nextCoverState === CoverState.OPEN
        ) {
          logger('The open was blocked by illumination 🚫');
          logger(
            stringify({
              name: this.name,
              illumination,
              state: this.state,
            }),
          );

          return Computation.CONTINUE;
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

        return Computation.STOP;
      }
    }

    return Computation.CONTINUE;
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
     * Создаем приоритет для закрывания.
     */
    const openCloseByTime = this.settings.openCloseByTime.sort((a, b) => {
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

    let nextCoverState = this.state.cover;

    if (toOpen) {
      nextCoverState = CoverState.OPEN;
    }

    if (toClose) {
      nextCoverState = CoverState.CLOSE;
    }

    if (this.isBlockedByTimeRange(nextCoverState)) {
      return;
    }

    if (this.state.cover !== nextCoverState) {
      logger('Switching has been performed at a given time point ✅');
      logger(
        stringify({
          name: this.name,
          openCloseByTime: this.settings.openCloseByTime,
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
    /**
     * TODO Реализовать автоматизации работающие по сенсорам
     */
  };

  protected output = () => {
    this.nextOutput = {
      states: [],
      positions: [],
    };

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  };

  protected send = () => {};

  protected destroy() {
    clearInterval(this.timer);
  }

  protected isSwitchHasBeenUp(): boolean {
    return super.isSwitchHasBeenUp(this.settings.switchers);
  }

  protected isSwitchHasBeenDown(): boolean {
    return super.isSwitchHasBeenDown(this.settings.switchers);
  }
}

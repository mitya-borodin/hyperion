/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable unicorn/no-array-callback-reference */
/* eslint-disable unicorn/no-array-for-each */
import EventEmitter from 'node:events';

import { addHours, addMinutes, compareAsc, format, subMinutes } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { getTimes } from 'suncalc';
import { v4 } from 'uuid';

import { stringify } from '../../helpers/json-stringify';
import { JsonObject } from '../../helpers/json-types';
import { config } from '../../infrastructure/config';
import { MacrosPort, MacrosData } from '../../ports/macros-settings-port';
import { ControlType, toDomainControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { MacrosType } from './showcase';

const logger = debug('hyperion:macros');

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
 * Создание базового класса макроса было мотивировано:
 * 1. Желанием унифицировать структуру и жизненные циклы макроса
 * 2. Реализовывать общие
 */

export type SettingsBase = { [key: string]: unknown };
export type StateBase = JsonObject;

export type MacrosParameters<SETTINGS, STATE> = {
  readonly macrosRepository: MacrosPort;

  readonly eventBus: EventEmitter;

  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];

  readonly settings: SETTINGS;

  readonly state: STATE;

  /**
   * Версия это целое число, нужна чтобы понимать, есть ли брейкинги в макросе.
   * Позволяет на основе версий делать миграции для settings.
   * Версия указывается в конструкторе конкретного макроса, и должна быть увеличина если в макросе есть брейкиг,
   *  а так же должна быть написана процедура перехода структуры settings из одной версии в другую.
   */
  readonly version?: number;

  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
};

type PrivateMacrosParameters<TYPE extends MacrosType> = {
  readonly type: TYPE;
  readonly version: number;
  readonly collectingDebounceMs?: number;
  readonly collectingThrottleMs?: number;
  readonly sensorBasedComputingThrottleMs?: number;
};

export type MacrosAccept = {
  previous: Map<string, HyperionDeviceControl>;
  current: HyperionDevice;
  devices: Map<string, HyperionDevice>;
  controls: Map<string, HyperionDeviceControl>;
};

export type MacrosEject<SETTINGS extends SettingsBase = SettingsBase, STATE extends StateBase = StateBase> = {
  type: MacrosType;

  id: string;
  name: string;
  description: string;
  labels: string[];

  settings: SETTINGS;

  state: STATE;
};

export abstract class Macros<
  TYPE extends MacrosType = MacrosType,
  SETTINGS extends SettingsBase = SettingsBase,
  STATE extends StateBase = StateBase,
> {
  readonly version: number;

  /**
   * ! Общие зависимости всех макросов
   */
  protected readonly macrosRepository: MacrosPort;
  protected readonly eventBus: EventEmitter;

  /**
   * ! Данные устройств
   */
  protected devices: Map<string, HyperionDevice>;
  protected previous: Map<string, HyperionDeviceControl>;
  protected controls: Map<string, HyperionDeviceControl>;

  /**
   * ! Общие параметры всех макросов
   */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];

  /**
   * ! Уникальные параметры макроса
   */
  readonly type: TYPE;
  readonly settings: SETTINGS;
  readonly controlTypes: Map<string, ControlType>;
  readonly state: STATE;

  /**
   * ! Внутреннее состояние макроса
   */
  readonly movingArranges: Map<
    string,
    { sum: number; avg: number; width: Date; stack: Array<{ date: Date; value: number }> }
  >;

  constructor({
    version,
    macrosRepository,
    eventBus,
    id,
    name,
    description,
    labels,
    type,
    settings,
    state,
    devices,
    controls,
    collectingThrottleMs = 0,
    collectingDebounceMs = 0,
    sensorBasedComputingThrottleMs = 0,
  }: MacrosParameters<SETTINGS, STATE> & PrivateMacrosParameters<TYPE>) {
    this.version = version;

    this.macrosRepository = macrosRepository;
    this.eventBus = eventBus;

    this.previous = new Map();
    this.devices = devices;
    this.controls = controls;

    this.id = id ?? v4();
    this.name = name;
    this.description = description;
    this.labels = labels;

    this.type = type;
    this.settings = settings;
    this.state = state;

    this.movingArranges = new Map();

    this.controlTypes = new Map();

    this.parseControlTypes(this.settings);

    process.nextTick(() => {
      if (collectingThrottleMs > 0) {
        this.collecting = throttle(this.collecting.bind(this), collectingThrottleMs);
      } else if (collectingDebounceMs > 0) {
        this.collecting = debounce(this.collecting.bind(this), collectingDebounceMs, {
          leading: false,
          trailing: true,
        });
      }

      if (sensorBasedComputingThrottleMs > 0) {
        this.sensorBasedComputing = throttle(
          this.sensorBasedComputing.bind(this),
          sensorBasedComputingThrottleMs,
        ) as () => boolean;
      }

      this.saveState = throttle(this.saveState.bind(this), 500) as () => Promise<MacrosData | Error>;
    });
  }

  private parseControlTypes = (settings: SettingsBase) => {
    if (typeof settings !== 'object') {
      return;
    }

    if (Array.isArray(settings)) {
      settings.filter((item) => typeof item === 'object').forEach(this.parseControlTypes);

      return;
    }

    const { deviceId, controlId, controlType } = settings;

    const hasDeviceId = typeof deviceId === 'string' && Boolean(deviceId);
    const hasControlId = typeof controlId === 'string' && Boolean(controlId);
    const hasControlType = typeof controlType === 'string' && Boolean(controlType);

    if (hasDeviceId && hasControlId && hasControlType) {
      const id = getControlId({ deviceId, controlId });

      this.controlTypes.set(id, toDomainControlType(controlType));
    }

    Object.values(settings)
      .filter((item) => typeof item === 'object')
      .forEach((item) => this.parseControlTypes(item as SettingsBase));
  };

  static migrate = (
    json: string,
    from: number,
    to: number,
    mappers: Array<(from: any) => unknown>,
    type: 'settings' | 'state',
  ) => {
    if (type === 'settings') {
      logger('Migrate settings was started 🚀');
    }

    if (type === 'state') {
      logger('Migrate state was started 🚀');
    }

    logger(stringify({ type, from, to }));

    const mappersSubSet = mappers.slice(from, to);

    logger({ mappers, mappersSubSet });

    if (mappersSubSet.length === 0) {
      if (type === 'settings') {
        logger('Settings in the current version ✅');
      }

      if (type === 'state') {
        logger('State in the current version ✅');
      }

      /**
       * TODO Проверять через JSON Schema
       */

      return JSON.parse(json);
    }

    const result = mappersSubSet.reduce((accumulator, mapper) => mapper(accumulator), JSON.parse(json));

    logger(stringify(result));

    if (type === 'settings') {
      logger('Migrate settings or state was finished ✅');
    }

    if (type === 'state') {
      logger('Migrate state or state was finished ✅');
    }

    /**
     * TODO Проверять через JSON Schema
     */

    return result;
  };

  abstract setState(nextStateJson: string): void;

  /**
   * Сохраняет состояние макроса в базу, не чаще чем раз в 500 мс.
   */
  protected saveState(): Promise<MacrosData | Error> {
    logger('Try to save macros state 💾');
    logger(JSON.stringify(this.state, null, 2));

    return this.macrosRepository.saveState(this);
  }

  accept({ previous, current, devices, controls }: MacrosAccept): void {
    this.previous = previous;
    this.devices = devices;
    this.controls = controls;

    if (this.isDevicesReady() && this.isControlValueHasBeenChanged(current)) {
      this.execute(current);
    }
  }

  /**
   * Метод предназначен запускать процесс выполнения логики макроса.
   *
   * Всегда содержит три стадии выполнения:
   * 1. collecting - сбор данных с контролов и проецирование этих данных на состояние.
   * 2. priorityComputation - приоритетное вычисление нового состояния контрола,
   *    если новое состояние вычислено, то процесс прерывается на этом этапе.
   * 3. computation - вычисление нового состояния контрола.
   */
  protected execute = (current?: HyperionDevice) => {
    this.collecting(current);

    if (this.priorityComputation(current)) {
      return;
    } else if (this.actionBasedComputing(current)) {
      return;
    } else if (this.sensorBasedComputing()) {
      return;
    }
  };

  /**
   * Операция сбора значений с контролов, имеет максимальный приоритет, и по этому всегда
   * выполняется первой.
   *
   * Не производит никакого next output.
   */
  protected abstract collecting(current?: HyperionDevice): void;

  /**
   * Операция приоритетного вычисления next output исходя из всех имеющихся данных.
   *
   * Если next output был вычислен, выполнению следующих стадий прерывается.
   */
  protected abstract priorityComputation(current?: HyperionDevice): boolean;

  /**
   * Операция вычисления output основанная не действиях пользователя и всех доступных данных.
   */
  protected abstract actionBasedComputing(current?: HyperionDevice): boolean;

  /**
   * Операция вычисления output основанная на данных сенсоров и всех доступных данных.
   */
  protected abstract sensorBasedComputing(): boolean;

  /**
   * Метод предназначен вычислять будущее состояние контролов, исходя из текущего состояния макроса.
   */
  protected abstract computeOutput(): void;

  /**
   * Метод предназначен отправлять будущее состояние контролов контроллеру.
   */
  protected abstract send(): void;

  /**
   * Метод предназначен остановить все процессы порожденные макросом.
   */
  protected abstract destroy(): void;

  /**
   * Метод предназначен извлекать из макроса информацию, которая предназначена для хранения в БД.
   */
  toJS = (): MacrosEject<SETTINGS, STATE> => {
    return cloneDeep({
      type: this.type,

      id: this.id,
      name: this.name,
      description: this.description,
      labels: this.labels,

      settings: this.settings,

      state: this.state,
    });
  };

  /**
   * Проверяет, есть ли в устройстве контролы которые используются в текущем макросе,
   * и сравнивает новое значение с прежним, если отличается то возвращает true.
   */
  protected isControlValueHasBeenChanged(device: HyperionDevice): boolean {
    for (const control of device.controls) {
      const id = getControlId({ deviceId: device.id, controlId: control.id });
      const isSuitableControl = this.controlTypes.has(id);

      if (isSuitableControl) {
        const previous = this.previous.get(id);
        const current = this.controls.get(id);

        if (current?.type === ControlType.ENUM) {
          return true;
        }

        if (previous?.value !== current?.value) {
          /**
           * TODO Придумать, как включать логи указанного метода.
           * TODO Скорее всего через экземпляр логера с подскоупом для этого метода.
           */
          // if (this.name === 'Освещение 1 рабочего места' && device.id === 'wb-gpio' && control.id === 'EXT2_IN2') {
          //   logger('A suitable control has been detected 🕵️‍♂️ 🕵️‍♂️ 🕵️‍♂️');
          //   logger(
          //     stringify({
          //       name: this.name,
          //       macros: omit(this.toJS(), ['labels', 'settings']),
          //       device: { id: device.id, controls: device.controls.map(({ id, value }) => ({ id, value })) },
          //     }),
          //   );
          // }

          return true;
        }
      }
    }

    return false;
  }

  /**
   * UP - означает получен верхний уровень, "1", "true", что то переводимое
   * в истину, включено, контакты замкнуты.
   */
  protected isSwitchHasBeenUp(switches: Array<{ deviceId: string; controlId: string }>): boolean {
    return switches.some((item) => {
      const previous = this.previous.get(getControlId(item));
      const current = this.controls.get(getControlId(item));

      if (!previous || !current) {
        return false;
      }

      if (current.type === ControlType.SWITCH && previous.value !== current.value && current.value === current.on) {
        return true;
      }

      return false;
    });
  }

  /**
   * DOWN - означает получен низкий уровень, "0", "false", что то
   * переводимое в лож, выключено, контакты разомкнуты.
   */
  protected isSwitchHasBeenDown(switches: Array<{ deviceId: string; controlId: string }>): boolean {
    return switches.some((item) => {
      const previous = this.previous.get(getControlId(item));
      const current = this.controls.get(getControlId(item));

      if (!previous || !current) {
        return false;
      }

      if (
        current.type === ControlType.SWITCH &&
        previous.value !== current.value &&
        previous.value === current.on &&
        current.value === current.off
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Метод предотвращает вызов метода execute, если не все контролы требуемые макросу доступны.
   *
   * Контролы появляются с разной скоростью, если прежде они не были добавлены в БД.
   */
  protected isDevicesReady(): boolean {
    const isDevicesReady = [...this.controlTypes.entries()].every(([id, controlType]) => {
      const control = this.controls.get(id);

      if (control?.type !== controlType) {
        logger({
          message: 'The type of control does not match the type in the settings 🚨',
          name: this.name,
          id,
          controlType,
          control: control ?? 'NOT FOUND',
        });
      }

      return control?.type === controlType;
    });

    if (!isDevicesReady) {
      logger({
        message: 'The devices are not ready for use in this macro 🚨',
        name: this.name,
        labels: this.labels,
        devices: this.devices.size,
        controls: this.controls.size,
      });
    }

    return isDevicesReady;
  }

  /**
   * Метод определяет попадает ли текущий момент время в диапазон.
   *
   * from - вводится либо в часах либо в минутах в зависимости от выбранного типа,
   * в местном времени пользователя.
   *
   * to - вводится либо в часах либо в минутах в зависимости от выбранного типа,
   * в местном времени пользователя.
   */
  protected hasHourOverlap(from: number, to: number, type: 'hour' | 'min') {
    if (to <= from) {
      if (type === 'hour') {
        to = to + 24;
      }

      if (type === 'min') {
        to = to + 24 * 60;
      }
    }

    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const date = new Date().getDate();

    let fromMs = 0;
    let toMs = 0;

    if (type === 'hour') {
      fromMs = addHours(new Date(year, month, date, 0, 0, 0, 0), from).getTime();
      toMs = addHours(new Date(year, month, date, 0, 0, 0, 0), to).getTime();
    }

    if (type === 'min') {
      fromMs = addMinutes(new Date(year, month, date, 0, 0, 0, 0), from).getTime();
      toMs = addMinutes(new Date(year, month, date, 0, 0, 0, 0), to).getTime();
    }

    const nowMs = utcToZonedTime(new Date(), config.client.timeZone).getTime();

    /**
     * TODO Придумать, как включать логи указанного метода.
     * TODO Скорее всего через экземпляр логера с подскоупом для этого метода.
     */
    // logger({
    //   name: this.name,
    //   message: 'hasHourOverlap',
    //   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    //   from,
    //   to,
    //   type,
    //   fromMs,
    //   toMs,
    //   nowMs,
    //   hasHourOverlap: nowMs >= fromMs && nowMs <= toMs,
    // });

    return nowMs >= fromMs && nowMs <= toMs;
  }

  protected get now(): string {
    return format(this.getDate(), 'yyyy.MM.dd HH:mm:ss OOOO');
  }

  protected getDate = () => {
    return utcToZonedTime(new Date(), config.client.timeZone);
  };

  protected get time(): { sunrise: Date; sunset: Date } {
    /**
     * SunCalc
     *
     * https://www.npmjs.com/package/suncalc
     *
     * sunriseEnd - bottom edge of the sun touches the horizon
     * sunset - sun disappears below the horizon, evening civil twilight starts
     */
    const { sunriseEnd, sunset } = getTimes(this.getDate(), 55.428_947, 49.223_72, 90);

    return {
      sunrise: utcToZonedTime(sunriseEnd, config.client.timeZone),
      sunset: utcToZonedTime(sunset, config.client.timeZone),
    };
  }

  protected get isDay(): boolean {
    return compareAsc(this.getDate(), this.time.sunrise) === 1 && !this.isNight;
  }

  protected get isNight(): boolean {
    return compareAsc(this.getDate(), this.time.sunset) === 1 || compareAsc(this.getDate(), this.time.sunrise) === -1;
  }

  protected getValueByDetection = (
    devices: Array<{ deviceId: string; controlId: string }>,
    detection: LevelDetection,
  ) => {
    let result = -1;

    for (const { deviceId, controlId } of devices) {
      const control = this.controls.get(getControlId({ deviceId, controlId }));

      if (control) {
        const value = Number(control.value);

        if (result === -1) {
          result = value;

          continue;
        }

        if (detection === LevelDetection.MAX && value > result) {
          result = value;
        }

        if (detection === LevelDetection.MIN && value < result) {
          result = value;
        }

        if (detection === LevelDetection.AVG) {
          result += value;
        }
      }
    }

    if (detection === LevelDetection.AVG) {
      result = result / devices.length;
    }

    return result;
  };

  protected computeMovingArrange = (name: string, value: number): number => {
    const movingArrange = this.movingArranges.get(name) ?? {
      sum: 0,
      avg: 0,
      /**
       * Ширина скользящей в минутах.
       */
      width: subMinutes(new Date(), 10),
      stack: [],
    };

    if (typeof value === 'number' && value >= 0) {
      movingArrange.stack.push({ date: new Date(), value });
      movingArrange.sum += value;
      movingArrange.avg = movingArrange.sum / movingArrange.stack.length;

      this.movingArranges.set(name, movingArrange);

      return movingArrange.avg;
    }

    // logger('The procedure for moving the "moving average" has been started 🛝');
    // logger({
    //   beforeMove: {
    //     name: this.name,
    //     now: format(this.getDate(), 'yyyy.MM.dd HH:mm:ss OOOO'),
    //     value,
    //     sum: movingArrange.sum,
    //     avg: movingArrange.avg,
    //     width: movingArrange.width,
    //     stack: movingArrange.stack.length,
    //   },
    // });

    const stack = [];

    movingArrange.width = addMinutes(movingArrange.width, 1);
    movingArrange.sum = 0;
    movingArrange.avg = 0;

    for (let index = 0; index < movingArrange.stack.length; index++) {
      const item = movingArrange.stack[index];

      if (compareAsc(item.date, movingArrange.width) >= 0) {
        stack.push(item);
        movingArrange.sum += item.value;
        movingArrange.avg = movingArrange.sum / stack.length;
      }
    }

    movingArrange.stack = stack;

    // logger({
    //   afterMove: {
    //     name: this.name,
    //     now: format(this.getDate(), 'yyyy.MM.dd HH:mm:ss OOOO'),
    //     value,
    //     sum: movingArrange.sum,
    //     avg: movingArrange.avg,
    //     width: movingArrange.width,
    //     stack: movingArrange.stack.length,
    //   },
    // });

    this.movingArranges.set(name, movingArrange);

    return movingArrange.avg;
  };

  protected clearMovingArrange = (name: string) => {
    this.movingArranges.delete(name);
  };
}

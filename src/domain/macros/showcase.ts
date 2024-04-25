import { BoilerMacros } from './boiler';
import BoilerMacrosSettings from './boiler/settings.json';
import BoilerMacrosPublicState from './boiler/state.json';
import { CounterMacros } from './counter';
import CounterMacrosSettings from './counter/settings.json';
import CounterMacrosPublicState from './counter/state.json';
import { CoverMacros } from './cover';
import { LeaksMacros } from './leaks';
import LeaksMacrosSettings from './leaks/settings.json';
import LeaksMacrosPublicState from './leaks/state.json';
import { LightingMacros } from './lighting';
import LightingMacrosSettings from './lighting/settings.json';
import LightingMacrosPublicState from './lighting/state.json';
import { PumpMacros } from './pump';
import PumpMacrosSettings from './pump/settings.json';
import PumpMacrosPublicState from './pump/state.json';
import { RecirculationMacros } from './recirculation';
import RecirculationMacrosSettings from './recirculation/settings.json';
import RecirculationMacrosPublicState from './recirculation/state.json';

/**
 * Витрина позволяет фронту:
 * 1. Узнать какие есть макросы
 * 2. Узнать json schema для settings и state
 *
 * Витрина позволяет бэку:
 * 1. Преобразовывать тип макросса в доменное представление
 * 2. Получать ссылку на конструктор макроса по типу
 */

/**
 * ! ADD_MACROS - Добавить тип макроса
 */
export enum MacrosType {
  UNSPECIFIED = 'UNSPECIFIED',
  LIGHTING = 'LIGHTING',
  HEATING = 'HEATING',
  VENTILATION = 'VENTILATION',
  HUMIDIFICATION = 'HUMIDIFICATION',
  CONDITIONING = 'CONDITIONING',
  BOILER = 'BOILER',
  COUNTER = 'COUNTER',
  LEAKS = 'LEAKS',
  PUMP = 'PUMP',
  RECIRCULATION = 'RECIRCULATION',
  SNOW_MELTING = 'SNOW_MELTING',
  SWIMMING_POOL = 'SWIMMING_POOL',
  COVER = 'COVER',
  HEATING_CABLE = 'HEATING_CABLE',
  MASTER_SWITCH = 'MASTER_SWITCH',
  SECURITY = 'SECURITY',
  UPS = 'UPS',
  AUTOMATIC_RESERVE_ENTRY = 'AUTOMATIC_RESERVE_ENTRY',
}

export const toDomainMacrosType = (input: unknown): MacrosType => {
  /**
   * ! ADD_MACROS - Добавить тип макроса
   */
  if (input === MacrosType.LIGHTING) {
    return MacrosType.LIGHTING;
  }

  if (input === MacrosType.HEATING) {
    return MacrosType.HEATING;
  }

  if (input === MacrosType.VENTILATION) {
    return MacrosType.VENTILATION;
  }

  if (input === MacrosType.HUMIDIFICATION) {
    return MacrosType.HUMIDIFICATION;
  }

  if (input === MacrosType.CONDITIONING) {
    return MacrosType.CONDITIONING;
  }

  if (input === MacrosType.BOILER) {
    return MacrosType.BOILER;
  }

  if (input === MacrosType.COUNTER) {
    return MacrosType.COUNTER;
  }

  if (input === MacrosType.LEAKS) {
    return MacrosType.LEAKS;
  }

  if (input === MacrosType.PUMP) {
    return MacrosType.PUMP;
  }

  if (input === MacrosType.RECIRCULATION) {
    return MacrosType.RECIRCULATION;
  }

  if (input === MacrosType.SNOW_MELTING) {
    return MacrosType.SNOW_MELTING;
  }

  if (input === MacrosType.SWIMMING_POOL) {
    return MacrosType.SWIMMING_POOL;
  }

  if (input === MacrosType.COVER) {
    return MacrosType.COVER;
  }

  if (input === MacrosType.HEATING_CABLE) {
    return MacrosType.HEATING_CABLE;
  }

  if (input === MacrosType.MASTER_SWITCH) {
    return MacrosType.MASTER_SWITCH;
  }

  if (input === MacrosType.SECURITY) {
    return MacrosType.SECURITY;
  }

  if (input === MacrosType.UPS) {
    return MacrosType.UPS;
  }

  if (input === MacrosType.AUTOMATIC_RESERVE_ENTRY) {
    return MacrosType.AUTOMATIC_RESERVE_ENTRY;
  }

  return MacrosType.UNSPECIFIED;
};

/**
 * ! ADD_MACROS - Добавить конструктор макроса
 */
export const macrosByType = {
  [MacrosType.LIGHTING]: LightingMacros,
  [MacrosType.COVER]: CoverMacros,
  [MacrosType.HEATING]: LightingMacros,
  [MacrosType.COUNTER]: CounterMacros,
  [MacrosType.LEAKS]: LeaksMacros,
  [MacrosType.PUMP]: PumpMacros,
  [MacrosType.BOILER]: BoilerMacros,
  [MacrosType.RECIRCULATION]: RecirculationMacros,
  [MacrosType.VENTILATION]: LightingMacros,
  [MacrosType.HUMIDIFICATION]: LightingMacros,
  [MacrosType.CONDITIONING]: LightingMacros,
  [MacrosType.SECURITY]: LightingMacros,
  [MacrosType.MASTER_SWITCH]: LightingMacros,
  [MacrosType.HEATING_CABLE]: LightingMacros,
  [MacrosType.UPS]: LightingMacros,
  [MacrosType.AUTOMATIC_RESERVE_ENTRY]: LightingMacros,
  [MacrosType.SNOW_MELTING]: LightingMacros,
  [MacrosType.SWIMMING_POOL]: LightingMacros,
};

/**
 * ! ADD_MACROS - Добавить описание макроса на витрину
 */
export const macrosShowcase = {
  [MacrosType.LIGHTING]: {
    name: 'Освещение',
    description: 'Позволяет управлять освещением как релейно так и RGBW лентами.',
    settings: LightingMacrosSettings,
    state: LightingMacrosPublicState,
  },
  [MacrosType.COVER]: {
    name: 'Крышка',
    description: 'Позволяет управлять шторами, воротами, всем тем, что может открываться и закрываться.',
  },
  [MacrosType.HEATING]: {
    name: 'Отопление',
    description:
      'Позволяет управлять нагревом поверхностей пола, стен, уличных дорожек, воздуха в помещениях,' +
      ' воздуха в системе вентиляции. По средством управления котлами, насосными узлами, ' +
      'термостатическими приводами, смесительными устройствами.',
  },
  [MacrosType.COUNTER]: {
    name: 'Счетчик',
    description:
      'Позволяет создать счетчики воды, газа, электричества, тепла, количества (верхних, нижних) уровней' +
      ' на переключателях, время работы, простоя реле.',
    settings: CounterMacrosSettings,
    state: CounterMacrosPublicState,
  },
  [MacrosType.LEAKS]: {
    name: 'Протечка',
    description: 'Позволяет закрыть нужный кран при обнаружении протечки, по средством связи крана и датчика протечки.',
    settings: LeaksMacrosSettings,
    state: LeaksMacrosPublicState,
  },
  [MacrosType.PUMP]: {
    name: 'Насос',
    description: 'Позволяет отключить насос при обнаружении протечки, по средством управления контактором.',
    settings: PumpMacrosSettings,
    state: PumpMacrosPublicState,
  },
  [MacrosType.BOILER]: {
    name: 'Параллельная загрузка бойлера',
    description:
      'Позволяет нагревать бойлер от контура отопления, без переключения на контур ГВС и ' +
      'остановки отопления, полезно использовать при наличии подогрева воздуха в вентиляции для ' +
      'избежания замерзания калорифера.',
    settings: BoilerMacrosSettings,
    state: BoilerMacrosPublicState,
  },
  [MacrosType.RECIRCULATION]: {
    name: 'Рециркуляция ГВС',
    description:
      'Позволяет управлять насосом рециркуляции ГВС опираясь на нажатия кнопок, датчики движения, шума,' +
      ' протечек, так же на расписание включений.',
    settings: RecirculationMacrosSettings,
    state: RecirculationMacrosPublicState,
  },
  [MacrosType.VENTILATION]: {
    name: 'Вентиляция',
    description:
      'Позволяет управлять качеством воздуха в помещениях.' +
      'По средством управления вентиляторами, приводами задвижек, системой отопления.',
  },
  [MacrosType.HUMIDIFICATION]: {
    name: 'Увлажнение',
    description:
      'Позволяет управлять влажностью воздуха в помещениях.' +
      'по средством релейного управления увлажнителями воздуха, ' +
      'либо релейного управления стационарной системой увлажнения.',
  },
  [MacrosType.CONDITIONING]: {
    name: 'Кондиционирование',
    description: 'Позволяет управлять процессом охлаждения и нагрева воздуха в помещениях по средством кондиционеров.',
  },
  [MacrosType.SECURITY]: {
    name: 'Безопасность',
    description: 'Позволяет узнать о открытии дверей и окон.',
  },
  [MacrosType.MASTER_SWITCH]: {
    name: 'Мастер выключатель',
    description: 'Позволяет отключать линии которые не используются без пользователей.',
  },
  [MacrosType.HEATING_CABLE]: {
    name: 'Греющий кабель',
    description:
      'Позволяет релейно управлять греющим кабелем. Может быть использована для различных целей.' +
      'Подогрев водостоков, трубы ХВС, рамки входной двери, ' +
      ' подогрев стекол в окнах в которые вклеен греющий слой, подоконников, порогов',
  },
  [MacrosType.UPS]: {
    name: 'Источник бесперебойного питания',
    description: 'Позволяет определять состояние заряда ИБП, и запускать генератор до полной разрядки аккумуляторов.',
  },
  [MacrosType.AUTOMATIC_RESERVE_ENTRY]: {
    name: 'Автоматический ввод резерва',
    description:
      'Позволяет автоматически переключить электроснабжение с сетевого на генератор.' +
      'При появлении сети переключиться обратно на сеть.' +
      'Позволяет отслеживать количества топлива в генераторе, ' +
      'через потребляемую мощность и паспортные данные генератора.',
  },
  [MacrosType.SNOW_MELTING]: {
    name: 'Снега таяние',
    description: 'Позволяет управлять системой таяния снега.',
  },
  [MacrosType.SWIMMING_POOL]: {
    name: 'Бассейн',
    description: 'Позволяет управлять состоянием бассейна, температура, наполнение, слив, фильтрация (вкл/вык)',
  },
};

/**
 * ! ADD_MACROS - Добавить экспорт json схемы
 */
export { default as lightingMacrosSettingsSchema } from './lighting/settings.json';
export { default as lightingMacrosStateSchema } from './lighting/state.json';

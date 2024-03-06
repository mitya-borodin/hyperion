import { LightingMacros } from './lighting';

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
  LIGHTING = 'LIGHTING',
  HEATING = 'HEATING',
  VENTILATION = 'VENTILATION',
  HUMIDIFICATION = 'HUMIDIFICATION',
  CONDITIONING = 'CONDITIONING',
  WATER_SUPPLY = 'WATER_SUPPLY',
  SNOW_MELTING = 'SNOW_MELTING',
  SWIMMING_POOL = 'SWIMMING_POOL',
  COVER_OPENING = 'COVER_OPENING',
  HEATING_CABLE = 'HEATING_CABLE',
  MASTER_SWITCH = 'MASTER_SWITCH',
  SECURITY = 'SECURITY',
  ACCOUNTING = 'ACCOUNTING',
  UPS = 'UPS',
  AUTOMATIC_RESERVE_ENTRY = 'AUTOMATIC_RESERVE_ENTRY',
}

export const toDomainMacrosType = (input: unknown) => {
  /**
   * ! ADD_MACROS - Добавить тип макроса
   */
  let type = MacrosType.LIGHTING;

  if (input === MacrosType.LIGHTING) {
    type = MacrosType.LIGHTING;
  }

  if (input === MacrosType.HEATING) {
    type = MacrosType.HEATING;
  }

  if (input === MacrosType.VENTILATION) {
    type = MacrosType.VENTILATION;
  }

  if (input === MacrosType.HUMIDIFICATION) {
    type = MacrosType.HUMIDIFICATION;
  }

  if (input === MacrosType.CONDITIONING) {
    type = MacrosType.CONDITIONING;
  }

  if (input === MacrosType.WATER_SUPPLY) {
    type = MacrosType.WATER_SUPPLY;
  }

  if (input === MacrosType.SNOW_MELTING) {
    type = MacrosType.SNOW_MELTING;
  }

  if (input === MacrosType.SWIMMING_POOL) {
    type = MacrosType.SWIMMING_POOL;
  }

  if (input === MacrosType.COVER_OPENING) {
    type = MacrosType.COVER_OPENING;
  }

  if (input === MacrosType.HEATING_CABLE) {
    type = MacrosType.HEATING_CABLE;
  }

  if (input === MacrosType.MASTER_SWITCH) {
    type = MacrosType.MASTER_SWITCH;
  }

  if (input === MacrosType.SECURITY) {
    type = MacrosType.SECURITY;
  }

  if (input === MacrosType.ACCOUNTING) {
    type = MacrosType.ACCOUNTING;
  }

  if (input === MacrosType.UPS) {
    type = MacrosType.UPS;
  }

  if (input === MacrosType.AUTOMATIC_RESERVE_ENTRY) {
    type = MacrosType.AUTOMATIC_RESERVE_ENTRY;
  }

  return type;
};

/**
 * ! ADD_MACROS - Добавить конструктор макроса
 */
export const macrosMap = {
  [MacrosType.LIGHTING]: LightingMacros,
  [MacrosType.HEATING]: LightingMacros,
  [MacrosType.VENTILATION]: LightingMacros,
  [MacrosType.HUMIDIFICATION]: LightingMacros,
  [MacrosType.CONDITIONING]: LightingMacros,
  [MacrosType.WATER_SUPPLY]: LightingMacros,
  [MacrosType.SNOW_MELTING]: LightingMacros,
  [MacrosType.SWIMMING_POOL]: LightingMacros,
  [MacrosType.COVER_OPENING]: LightingMacros,
  [MacrosType.HEATING_CABLE]: LightingMacros,
  [MacrosType.MASTER_SWITCH]: LightingMacros,
  [MacrosType.SECURITY]: LightingMacros,
  [MacrosType.ACCOUNTING]: LightingMacros,
  [MacrosType.UPS]: LightingMacros,
  [MacrosType.AUTOMATIC_RESERVE_ENTRY]: LightingMacros,
};

/**
 * ! ADD_MACROS - Добавить описание макроса на витрину
 */
export const macrosShowcase = {
  [MacrosType.LIGHTING]: {
    name: 'Освещение',
    description: 'Позволяет управлять освещением как релейно так и RGBW лентами.',
  },
  [MacrosType.HEATING]: {
    name: 'Отопление',
    description:
      'Позволяет управлять нагревом поверхностей пола, стен, уличных дорожек, воздуха в помещениях,' +
      ' воздуха в системе вентиляции. По средством управления котлами, насосными узлами, ' +
      'термостатическими приводами, смесительными устройствами.',
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
  [MacrosType.WATER_SUPPLY]: {
    name: 'Водоснабжение',
    description:
      'Позволяет управлять системой горячего и холодного водоснабжения, циркуляцией ГВС,' +
      ' защитой от протечек, учет расхода холодной воды.' +
      'По средством управления насосами, кранами, и контролем показаний счетчиков.',
  },
  [MacrosType.SNOW_MELTING]: {
    name: 'Снега таяние',
    description: 'Позволяет управлять системой таяния снега.',
  },
  [MacrosType.SWIMMING_POOL]: {
    name: 'Бассейн',
    description: 'Позволяет управлять состоянием бассейна, температура, наполнение, слив, фильтрация (вкл/вык)',
  },
  [MacrosType.COVER_OPENING]: {
    name: 'Открывание крышек',
    description: 'Позволяет управлять шторами, воротами, всем тем, что может открываться и закрываться.',
  },
  [MacrosType.HEATING_CABLE]: {
    name: 'Греющий кабель',
    description:
      'Позволяет релейно управлять греющим кабелем. Может быть использована для различных целей.' +
      'Подогрев водостоков, трубы ХВС, рамки входной двери, ' +
      ' подогрев стекол в окнах в которые вклеен греющий слой, подоконников, порогов',
  },
  [MacrosType.MASTER_SWITCH]: {
    name: 'Мастер выключатель',
    description: 'Позволяет отключать линии которые не используются без пользователей.',
  },
  [MacrosType.SECURITY]: {
    name: 'Безопасность',
    description: 'Позволяет узнать о открытии дверей и окон.',
  },
  [MacrosType.ACCOUNTING]: {
    name: 'Учет',
    description:
      'Позволяет вести учет электричества, воды, газа, тепла.' + 'По средством подключения импульсных средств учета.',
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
};

/**
 * ! ADD_MACROS - Добавить экспорт json схемы
 */
export { default as lightingMacrosSettingsSchema } from './lighting/settings.json';
export { default as lightingMacrosStateSchema } from './lighting/state.json';

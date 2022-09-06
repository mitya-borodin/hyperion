import { BUTLER_RELAY } from "../../infrastructure/external-resource-adapters/wirenboard";

export enum LightingGroupState {
  ON = "ON",
  OFF = "OFF",
}

/**
 * Every LightingGroup is relay in wirenboard system
 */
export type LightingGroup = {
  /**
   * The unique identifier of the light group, is a human-readable string containing the name of the group
   * For example:
   * - "Гостиная основное освещение над столом"
   * - "Гостиная основное освещение над столом расширенное"
   * - "Гостиная основное освещение по центру кухни"
   * - "Гостиная основное освещение по краям кухни"
   * - "Гостиная основное освещение по центру стены"
   * - "Гостиная основное освещение по краям стены стены"
   * - "Гостиная основное освещение продолжение коридора"
   * - "Гостиная подсветка тумбы"
   * - "Кухня подсветка"
   * - "Игровая основное освещение"
   * - "Игровая люстра"
   * - "Игровая тумбочки"
   * - "Игровая рабочий стол"
   * - "Ванная основное освещение"
   * - "Ванная зеркало"
   * - "Спальня основное освещение"
   * - "Спальня тумбочки"
   * - "Прихожая основной свет проложение коридора"
   * - "Прихожая основной свет возле шкафа"
   * - "Коридор основной"
   * - "Крыльцо основной"
   * - "Хозяйственная основной"
   * - "Кабине основной свет за рабочим местом 1"
   * - "Кабине основной свет за рабочим местом 2"
   * - "Кабине рабочее место 1"
   * - "Кабине рабочее место 2"
   * - "Прожекторы север"
   * - "Прожекторы запад"
   * - "Прожекторы юг"
   * - "Прожекторы восток"
   * - "Фасад лента"
   * - "Труба лента"
   */
  readonly location: string;
  readonly state: LightingGroupState;
  /**
   * The name of the relay in the Butler system
   */
  readonly relays: BUTLER_RELAY[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

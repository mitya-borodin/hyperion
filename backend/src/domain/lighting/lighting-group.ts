import { COMMON_RELAY_NAME } from '../wirenboard/relays';

export enum LightingGroupState {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Каждая осветительная группа, это набор реальный реле.
 */
export type LightingGroup = {
  /**
   * location - это уникальный идентификатор осветительный группы, который выглядит как человеко
   * читаемая уникальная строка.
   * Например:
   * - "Гостиная основное освещение над столом"
   * - "Кухня подсветка"
   */
  readonly location: string;
  readonly relays: COMMON_RELAY_NAME[];
  readonly state: LightingGroupState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

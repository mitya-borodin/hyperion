import { Macros, SettingsBase } from '../domain/macroses/macros';
import { MacrosType } from '../graphql-types';
import { JsonObject } from '../helpers/json-types';

export type MacrosSettings = Pick<
  Macros<MacrosType, SettingsBase, JsonObject>,
  'id' | 'type' | 'name' | 'description' | 'labels' | 'settings'
>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IMacrosSettingsRepository {
  getAll(): Promise<MacrosSettings[]>;

  upsert(parameters: MacrosSettings): Promise<Error | MacrosSettings>;

  destroy(id: string): Promise<Error | MacrosSettings>;
}

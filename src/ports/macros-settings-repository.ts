import { Macros } from '../domain/macroses/macros';
import { MacrosType } from '../graphql-types';
import { JsonObject } from '../helpers/json-types';

export type MacrosSettings = Pick<
  Macros<MacrosType, JsonObject, JsonObject, JsonObject>,
  'id' | 'type' | 'name' | 'description' | 'labels' | 'settings'
>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IMacrosSettingsRepository {
  upsert(parameters: MacrosSettings): Promise<Error | MacrosSettings>;

  remove(id: string): Promise<Error | MacrosSettings>;
}

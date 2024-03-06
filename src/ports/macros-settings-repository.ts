import { Macros } from '../domain/macros/macros';

export type MacrosSettings = Pick<Macros, 'id' | 'type' | 'name' | 'description' | 'labels' | 'settings'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IMacrosSettingsRepository {
  getAll(): Promise<MacrosSettings[]>;

  upsert(parameters: MacrosSettings): Promise<Error | MacrosSettings>;

  destroy(id: string): Promise<Error | MacrosSettings>;
}

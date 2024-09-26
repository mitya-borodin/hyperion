import { Macros } from '../domain/macros/macros';

export type MacrosData = Pick<
  Macros,
  'id' | 'type' | 'name' | 'description' | 'labels' | 'settings' | 'state' | 'version'
>;

export type MacrosState = Pick<Macros, 'id' | 'state'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface MacrosPort {
  getAll(): Promise<MacrosData[]>;

  upsert(parameters: MacrosData): Promise<Error | MacrosData>;

  saveState(parameters: MacrosState): Promise<Error | MacrosData>;

  destroy(id: string): Promise<Error | MacrosData>;
}

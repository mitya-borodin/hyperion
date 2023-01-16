import { LightingGroup, LightingGroupState } from '../domain/lighting/lighting-group';
import { COMMON_RELAY_NAME } from '../domain/wirenboard/relays';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ILightingRepository {
  createLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;

  getLightingGroups(): Promise<LightingGroup[] | Error>;

  getLightingGroup(location: string): Promise<LightingGroup | Error>;

  setRelayToGroup(location: string, relays: COMMON_RELAY_NAME[]): Promise<LightingGroup[] | Error>;

  turnGroups(location: string[], state: LightingGroupState): Promise<LightingGroup[] | Error>;

  removeLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;
}

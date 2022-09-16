import { COMMON_RELAY_NAME } from "../wirenboard/relays";

import { LightingGroup, LightingGroupState } from "./lighting-group";

export interface ILightingRepository {
  getLightingGroups(): Promise<LightingGroup[] | Error>;

  getLightingGroup(location: string): Promise<LightingGroup | Error>;

  createLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;

  removeLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;

  setRelayToGroup(location: string, relays: COMMON_RELAY_NAME[]): Promise<LightingGroup[] | Error>;

  turnGroups(location: string[], state: LightingGroupState): Promise<LightingGroup[] | Error>;
}

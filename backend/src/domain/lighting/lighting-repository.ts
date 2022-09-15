import { COMMON_RELAY_NAME } from "../wirenboard/relays";

import { LightingGroup } from "./lighting-group";

export interface ILightingRepository {
  getLightingGroups(): Promise<LightingGroup[] | Error>;

  getLightingGroup(location: string): Promise<LightingGroup | Error>;

  createLightingGroups(locations: string[]): Promise<LightingGroup[] | Error>;

  removeLightingGroups(locations: string[]): Promise<undefined | Error>;

  addRelayToGroup(location: string, relays: COMMON_RELAY_NAME[]): Promise<LightingGroup | Error>;

  removeRelayFromGroup(
    location: string,
    relays: COMMON_RELAY_NAME[],
  ): Promise<LightingGroup | Error>;

  turnOnGroups(location: string[]): Promise<LightingGroup[] | Error>;

  turnOffGroups(location: string[]): Promise<LightingGroup[] | Error>;
}

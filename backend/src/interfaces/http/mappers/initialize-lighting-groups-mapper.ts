import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { InitializeLightingGroupReplySchema } from "../types/lighting/initialize-lighting-groups.reply";

export const mapInitializeLightingGroupsToHttp = (
  groups: LightingGroup[],
): InitializeLightingGroupReplySchema => {
  return groups;
};

import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { CreateLightingGroupReplySchema } from "../types/lighting/create-lighting-groups.reply";

export const mapCreateLightingGroupsToHttp = (
  groups: LightingGroup[],
): CreateLightingGroupReplySchema => {
  return groups;
};

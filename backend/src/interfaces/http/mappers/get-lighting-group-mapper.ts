import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { GetLightingGroupReplySchema } from "../types/lighting/get-lighting-group.reply";

export const mapGetLightingGroupToHttp = (group: LightingGroup): GetLightingGroupReplySchema => {
  return group;
};

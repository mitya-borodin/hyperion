import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { InitializeLightningGroupReplySchema } from "../types/lighting/initialize-lightning-group.reply";

export const mapInitializeLightningGroupsToHttp = (
  groups: LightingGroup[],
): InitializeLightningGroupReplySchema => {
  return groups;
};

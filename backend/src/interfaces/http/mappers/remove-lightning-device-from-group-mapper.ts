import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { RemoveLightningDeviceFromLightningGroupReplySchema } from "../types/lighting/remove-lightning-group.reply";

export const mapRemoveLightningDeviceFromGroupToHttp = (
  group: LightingGroup,
): RemoveLightningDeviceFromLightningGroupReplySchema => {
  return group;
};

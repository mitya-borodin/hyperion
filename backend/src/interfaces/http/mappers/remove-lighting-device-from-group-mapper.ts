import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { RemoveLightingDeviceFromGroupReplySchema } from "../types/lighting/remove-lighting-device-from-group.reply";

export const mapRemoveLightingDeviceFromGroupToHttp = (
  group: LightingGroup,
): RemoveLightingDeviceFromGroupReplySchema => {
  return group;
};

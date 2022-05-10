import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { AddLightingDeviceInGroupReplySchema } from "../types/lighting/add-lighting-device-in-group.reply";

export const mapAddLightingDeviceInGroupToHttp = (
  group: LightingGroup,
): AddLightingDeviceInGroupReplySchema => {
  return group;
};

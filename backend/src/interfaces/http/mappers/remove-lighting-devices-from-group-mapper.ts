import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { RemoveLightingDevicesFromGroupReplySchema } from "../types/lighting/remove-lighting-devices-from-group.reply";

export const mapRemoveLightingDevicesFromGroupToHttp = ([lightingGroup, lightingDevices]: [
  LightingGroup,
  LightingDevice[],
]): RemoveLightingDevicesFromGroupReplySchema => {
  return { lightingGroup, lightingDevices };
};

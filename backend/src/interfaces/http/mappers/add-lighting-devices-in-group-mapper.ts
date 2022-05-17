import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { AddLightingDevicesInGroupReplySchema } from "../types/lighting/add-lighting-devices-in-group.reply";
import { LightingDevice } from "../types/lighting/lighting-device";

export const mapAddLightingDevicesInGroupToHttp = ([lightingGroup, lightingDevices]: [
  LightingGroup,
  LightingDevice[],
]): AddLightingDevicesInGroupReplySchema => {
  return { lightingGroup, lightingDevices };
};

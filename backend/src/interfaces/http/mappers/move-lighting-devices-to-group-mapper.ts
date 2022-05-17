import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { MoveLightingDevicesToAnotherGroupReplySchema } from "../types/lighting/move-lighting-devices-to-another-group.reply";

export const mapMoveLightingDevicesToGroupToHttp = ([lightingGroup, lightingDevices]: [
  LightingGroup,
  LightingDevice[],
]): MoveLightingDevicesToAnotherGroupReplySchema => {
  return {
    lightingGroup,
    lightingDevices,
  };
};

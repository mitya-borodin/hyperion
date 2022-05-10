import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { MoveLightingGroupReplySchema } from "../types/lighting/move-lighting-group.reply";

export const mapMoveLightingDeviceToGroupToHttp = ([
  sourceLightingGroup,
  destinationLightingGroup,
]: [LightingGroup, LightingGroup]): MoveLightingGroupReplySchema => {
  return {
    sourceLightingGroup,
    destinationLightingGroup,
  };
};

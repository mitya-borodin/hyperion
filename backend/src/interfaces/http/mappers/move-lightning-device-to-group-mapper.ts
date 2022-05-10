import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { MoveLightningGroupReplySchema } from "../types/lighting/move-lightning-group.reply";

export const mapMoveLightningDeviceToGroupToHttp = ([
  sourceLightningGroup,
  destinationLightningGroup,
]: [LightingGroup, LightingGroup]): MoveLightningGroupReplySchema => {
  return {
    sourceLightningGroup,
    destinationLightningGroup,
  };
};

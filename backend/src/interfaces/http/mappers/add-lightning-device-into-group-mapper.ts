import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { AddLightningDeviceInLightningGroupReplySchema } from "../types/lighting/add-lightning-group.reply";

export const mapAddLightningDeviceIntoGroupToHttp = (
  group: LightingGroup,
): AddLightningDeviceInLightningGroupReplySchema => {
  return group;
};

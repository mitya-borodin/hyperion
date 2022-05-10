import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { GetLightningGroupReplySchema } from "../types/lighting/get-lightning-group.reply";

export const mapGetLightningGroupToHttp = (group: LightingGroup): GetLightningGroupReplySchema => {
  return group;
};

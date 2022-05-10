import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";

export const mapTurnOffGroupToHttp = (group: LightingGroup): TurnOffGroupReplySchema => {
  return group;
};

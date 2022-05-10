import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";

export const mapTurnOnGroupToHttp = (group: LightingGroup): TurnOnGroupReplySchema => {
  return group;
};

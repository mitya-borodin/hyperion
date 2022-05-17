import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { TurnOnGroupReplySchema } from "../types/lighting/turn-on-group.reply";

export const mapTurnOnGroupToHttp = ([lightingGroup, lightingDevices]: [
  LightingGroup,
  LightingDevice[],
]): TurnOnGroupReplySchema => {
  return { lightingGroup, lightingDevices };
};

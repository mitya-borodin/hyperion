import { LightingDevice } from "../../../domain/lighting/lighting-device";
import { LightingGroup } from "../../../domain/lighting/lighting-group";
import { TurnOffGroupReplySchema } from "../types/lighting/turn-off-group.reply";

export const mapTurnOffGroupToHttp = ([lightingGroup, lightingDevices]: [
  LightingGroup,
  LightingDevice[],
]): TurnOffGroupReplySchema => {
  return { lightingGroup, lightingDevices };
};

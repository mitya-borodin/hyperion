import { ControlType } from '../../../control-type';

import { SettingsTo2 as SettingsFrom2 } from './1-settings-from-1-to-2';

enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

enum LightingLevel {
  MAX = 3,
  HIGHT = 2,
  MIDDLE = 1,
  LOW = 0,
  UNSPECIFIED = -1,
}

enum LevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

type SettingsTo3 = {
  readonly devices: {
    readonly switchers: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;
    readonly illuminations: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.ILLUMINATION;
    }>;
    readonly motion: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;
    readonly noise: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SOUND_LEVEL;
    }>;
    readonly lightings: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.SWITCH;
    }>;
  };

  readonly properties: {
    readonly switcher: {
      readonly trigger: Trigger;
      readonly everyOn: boolean;
    };

    readonly illumination: {
      readonly detection: LevelDetection;
    };

    readonly motion: {
      readonly detection: LevelDetection;
    };

    readonly noise: {
      readonly detection: LevelDetection;
    };

    readonly autoOn: {
      readonly illumination: number;
      readonly motion: {
        readonly trigger: number;
        readonly active: {
          readonly from: number;
          readonly to: number;
        };
      };
      readonly block: {
        readonly illuminationHours: number;
      };
    };

    readonly autoOff: {
      readonly illumination: number;
      readonly motion: number;
      readonly noise: number;
      readonly silenceMin: number;
      readonly time: number;
      readonly block: {
        readonly illuminationHours: number;
        readonly handSwitchMin: number;
      };
    };
  };
};

export const settings_from_2_to_3 = (settings: SettingsFrom2): SettingsTo3 => {
  let autoOnIllumination = 0;

  if (settings.properties.autoOn.lightingLevel === LightingLevel.MAX) {
    autoOnIllumination = settings.properties.illumination.HIGHT;
  }

  if (settings.properties.autoOn.lightingLevel === LightingLevel.HIGHT) {
    autoOnIllumination = settings.properties.illumination.HIGHT;
  }

  if (settings.properties.autoOn.lightingLevel === LightingLevel.MIDDLE) {
    autoOnIllumination = settings.properties.illumination.MIDDLE;
  }

  if (settings.properties.autoOn.lightingLevel === LightingLevel.LOW) {
    autoOnIllumination = settings.properties.illumination.LOW;
  }

  let autoOffIllumination = 0;

  if (settings.properties.autoOff.lightingLevel === LightingLevel.MAX) {
    autoOffIllumination = settings.properties.illumination.HIGHT;
  }

  if (settings.properties.autoOff.lightingLevel === LightingLevel.HIGHT) {
    autoOffIllumination = settings.properties.illumination.HIGHT;
  }

  if (settings.properties.autoOff.lightingLevel === LightingLevel.MIDDLE) {
    autoOffIllumination = settings.properties.illumination.MIDDLE;
  }

  if (settings.properties.autoOff.lightingLevel === LightingLevel.LOW) {
    autoOffIllumination = settings.properties.illumination.LOW;
  }

  return {
    devices: {
      switchers: settings.devices.switchers.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.SWITCH,
      })),
      illuminations: settings.devices.illuminations.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.ILLUMINATION,
      })),
      motion: settings.devices.motion.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.VALUE,
      })),
      noise: settings.devices.noise.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.SOUND_LEVEL,
      })),
      lightings: settings.devices.lightings.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.SWITCH,
      })),
    },
    properties: {
      switcher: {
        trigger: settings.properties.switcher.trigger,
        everyOn: settings.properties.switcher.everyOn,
      },
      illumination: {
        detection: settings.properties.illumination.detection,
      },
      motion: {
        detection: settings.properties.motion.detection,
      },
      noise: {
        detection: settings.properties.noise.detection,
      },
      autoOn: {
        illumination: autoOnIllumination,
        motion: {
          trigger: settings.properties.autoOn.motion.trigger,
          active: {
            from: settings.properties.autoOn.motion.active.from,
            to: settings.properties.autoOn.motion.active.to,
          },
        },
        block: {
          illuminationHours: settings.properties.autoOn.block.illuminationHours,
        },
      },
      autoOff: {
        illumination: autoOffIllumination,
        motion: settings.properties.autoOff.motion,
        noise: settings.properties.autoOff.noise,
        silenceMin: settings.properties.autoOff.silenceMin,
        time: settings.properties.autoOff.time,
        block: {
          illuminationHours: settings.properties.autoOff.block.illuminationHours,
          handSwitchMin: settings.properties.autoOff.block.handSwitchMin,
        },
      },
    },
  };
};

import { ControlType } from '../../../control-type';

import { SettingsTo1 as SettingsFrom1 } from './0-settings-from-0-to-1';

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

type SettingsTo2 = {
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
      readonly HIGHT: number;
      readonly MIDDLE: number;
      readonly LOW: number;
      readonly detection: LevelDetection;
    };
    readonly motion: {
      readonly detection: LevelDetection;
    };
    readonly noise: {
      readonly detection: LevelDetection;
    };
    readonly autoOn: {
      readonly lightingLevel: LightingLevel;
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
      readonly lightingLevel: LightingLevel;
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

export const settings_from_1_to_2 = (settings: SettingsFrom1): SettingsTo2 => {
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
        HIGHT: settings.properties.illumination.HIGHT,
        MIDDLE: settings.properties.illumination.MIDDLE,
        LOW: settings.properties.illumination.LOW,
        detection: settings.properties.illumination.detection,
      },
      motion: {
        detection: settings.properties.motion.detection,
      },
      noise: {
        detection: settings.properties.noise.detection,
      },
      autoOn: {
        lightingLevel: settings.properties.autoOn.lightingLevel,
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
        lightingLevel: settings.properties.autoOff.lightingLevel,
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

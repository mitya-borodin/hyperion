import { ControlType } from '../../../control-type';

import { SettingsTo3 as SettingsFrom3 } from './2-settings-from-2-to-3';

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

export type SettingsTo4 = {
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
    readonly motions: Array<{
      readonly deviceId: string;
      readonly controlId: string;
      readonly controlType: ControlType.VALUE;
    }>;
    readonly noises: Array<{
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
      readonly boundary: {
        readonly onLux: number;
        readonly offLux: number;
      };
      readonly mul: number;
    };

    readonly motion: {
      readonly detection: LevelDetection;
      readonly trigger: number;
      readonly schedule: {
        readonly fromHour: number;
        readonly toHour: number;
      };
    };

    readonly noise: {
      readonly detection: LevelDetection;
      readonly trigger: number;
    };

    readonly silenceMin: number;
    readonly block: {
      readonly onMin: number;
      readonly offMin: number;
    };
    readonly offByTime: number;
  };
};

export const settings_from_3_to_4 = (settings: SettingsFrom3): SettingsTo4 => {
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
      motions: settings.devices.motion.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.VALUE,
      })),
      noises: settings.devices.noise.map(({ deviceId, controlId }) => ({
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
        boundary: {
          onLux: 15,
          offLux: 200,
        },
        mul: 2,
      },
      motion: {
        detection: settings.properties.motion.detection,
        trigger: settings.properties.autoOn.motion.trigger,
        schedule: {
          fromHour: settings.properties.autoOn.motion.active.from,
          toHour: settings.properties.autoOn.motion.active.to,
        },
      },
      noise: {
        detection: settings.properties.noise.detection,
        trigger: settings.properties.autoOff.noise,
      },
      silenceMin: settings.properties.autoOff.silenceMin,
      block: {
        onMin: settings.properties.autoOn.block.illuminationHours * 60,
        offMin: settings.properties.autoOff.block.illuminationHours * 60,
      },
      offByTime: settings.properties.autoOff.time,
    },
  };
};

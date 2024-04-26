import { ControlType } from '../../../control-type';

import { SettingsTo4 as SettingsFrom4 } from './3-settings-from-3-to-4';

enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

enum LevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

export type SettingsTo5 = {
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
    readonly autoOn: boolean;
  };
};

export const settings_from_4_to_5 = (settings: SettingsFrom4): SettingsTo5 => {
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
      motions: settings.devices.motions.map(({ deviceId, controlId }) => ({
        deviceId,
        controlId,
        controlType: ControlType.VALUE,
      })),
      noises: settings.devices.noises.map(({ deviceId, controlId }) => ({
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
        trigger: settings.properties.motion.trigger,
        schedule: {
          fromHour: settings.properties.motion.schedule.fromHour,
          toHour: settings.properties.motion.schedule.toHour,
        },
      },
      noise: {
        detection: settings.properties.noise.detection,
        trigger: settings.properties.noise.trigger,
      },
      silenceMin: settings.properties.silenceMin,
      block: {
        onMin: settings.properties.block.onMin,
        offMin: settings.properties.block.offMin,
      },
      offByTime: settings.properties.offByTime,
      autoOn: true,
    },
  };
};

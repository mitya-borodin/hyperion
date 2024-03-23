type SettingsFrom = {
  buttons: Array<{
    controlId: string;
    deviceId: string;
    trigger: string;
  }>;
  illuminations: Array<{
    controlId: string;
    deviceId: string;
    trigger: string;
  }>;
  lightings: Array<{
    controlId: string;
    deviceId: string;
  }>;
};

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

type SettingsTo = {
  readonly devices: {
    readonly switchers: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly illuminations: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly motion: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly noise: Array<{
      readonly deviceId: string;
      readonly controlId: string;
    }>;
    readonly lightings: Array<{
      readonly deviceId: string;
      readonly controlId: string;
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

export const settings_from_1_to_2 = (settings: SettingsFrom): SettingsTo => {
  return {
    devices: {
      switchers: settings.buttons.map(({ deviceId, controlId }) => ({ deviceId, controlId })),
      illuminations: settings.illuminations.map(({ deviceId, controlId }) => ({ deviceId, controlId })),
      motion: [],
      noise: [],
      lightings: settings.lightings.map(({ deviceId, controlId }) => ({ deviceId, controlId })),
    },
    properties: {
      switcher: {
        trigger: Trigger.DOWN,
        everyOn: false,
      },
      illumination: {
        HIGHT: 750,
        MIDDLE: 300,
        LOW: 25,
        detection: LevelDetection.MAX,
      },
      motion: {
        detection: LevelDetection.MAX,
      },
      noise: {
        detection: LevelDetection.MAX,
      },
      autoOn: {
        lightingLevel: LightingLevel.LOW,
        motion: {
          trigger: 60,
          active: {
            from: 15,
            to: 0,
          },
        },
        block: {
          illuminationHours: 0,
        },
      },
      autoOff: {
        lightingLevel: LightingLevel.MAX,
        motion: 60,
        noise: 45,
        silenceMin: 1,
        time: -1,
        block: {
          illuminationHours: 0,
          handSwitchMin: 15,
        },
      },
    },
  };
};

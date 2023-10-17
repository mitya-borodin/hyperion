import { Logger } from 'pino';
import { v4 } from 'uuid';

import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';

import { Macros, MacrosAccept, MacrosType } from './macros';

export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export type LightingMacrosState = {
  forceOn: 'ON' | 'OFF' | 'UNSPECIFIED';
};

export type LightingMacrosSettings = {
  readonly buttons: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ControlType.SWITCH;
    readonly trigger: string;
  }>;
  readonly illuminations: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly type: ControlType.ILLUMINATION;
    readonly trigger: string;
  }>;
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly topic: string;
    readonly type: ControlType.SWITCH;
    readonly level: LightingLevel;
  }>;
};

export type LightingMacrosOutput = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = {
  logger: Logger;
  id?: string;
  name: string;
  description: string;
  labels: string[];
  settings: LightingMacrosSettings;
};

export class LightingMacros
  implements Macros<MacrosType.LIGHTING, LightingMacrosState, LightingMacrosSettings, LightingMacrosOutput>
{
  readonly logger: Logger;
  readonly id: string;
  readonly type: MacrosType.LIGHTING;
  readonly name: string;
  readonly description: string;
  readonly labels: string[];
  readonly settings: LightingMacrosSettings;
  readonly createdAt: Date;

  readonly state: LightingMacrosState;
  readonly output: LightingMacrosOutput;

  private previous: Map<string, HyperionDeviceControl>;
  private controls: Map<string, HyperionDeviceControl>;

  constructor({ logger, id, name, description, labels, settings }: LightingMacrosParameters) {
    this.logger = logger;
    this.id = id ?? v4();
    this.type = MacrosType.LIGHTING;
    this.name = name;
    this.description = description;
    this.labels = labels;
    this.settings = settings;
    this.createdAt = new Date();

    this.state = {
      forceOn: 'UNSPECIFIED',
    };
    this.output = {
      lightings: [],
    };

    this.previous = new Map();
    this.controls = new Map();
  }

  setState = (state: LightingMacrosState): void => {
    this.state.forceOn = state.forceOn;

    this.execute();
  };

  accept = ({ previous, controls }: MacrosAccept): void => {
    this.previous = previous;
    this.controls = controls;

    this.execute();
  };

  private execute = () => {
    if (this.state.forceOn !== 'UNSPECIFIED') {
      // ! Тут переключаем ON | OFF
      return;
    }

    // ! Тут делаем выводы
  };
}

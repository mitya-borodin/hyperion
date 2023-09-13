import { ControlType, Macros, MacrosType } from './macros';

export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export type LightingMacrosSettings = {
  buttons: Array<{
    deviceId: string;
    controlId: string;
    type: ControlType.SWITCH;
    trigger: boolean;
  }>;
  illuminations: Array<{
    deviceId: string;
    controlId: string;
    type: ControlType.ILLUMINATION;
    trigger: number;
  }>;
  lightings: Array<{
    deviceId: string;
    controlId: string;
    type: ControlType.SWITCH;
    level: LightingLevel;
  }>;
};

export type LightingMacrosOutput = {
  lightings: Array<{
    deviceId: string;
    controlId: string;
    value: boolean;
  }>;
  messages: Array<{
    topic: string;
    message: string;
  }>;
};

export type LightingMacros = Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosOutput>;

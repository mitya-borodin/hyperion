import { JsonObject } from '../helpers/json-types';

import { ControlType } from './control-type';

export type HyperionDeviceControl = {
  id: string;

  title: {
    ru: string;
    en: string;
  };
  order: number;

  type: ControlType;

  readonly: boolean;

  units: string;

  max: number;
  min: number;
  step: number;
  precision: number;

  on: string;
  off: string;
  toggle: string;

  enum: string[];

  value: string;
  presets: JsonObject;

  topic: {
    read?: string;
    write?: string;
  };

  error: string;

  meta: JsonObject;

  labels: string[];

  markup: {
    title: {
      ru: string;
      en: string;
    };
    description: string;
    order: number;
    color: string;
  };
};

import { JsonObject } from '../helpers/json-types';

import { ControlType } from './control-type';

export type HyperionDeviceControl = {
  id: string;
  title: {
    ru: string;
    en: string;
  };
  order: number;
  readonly: boolean;
  type: ControlType;
  units: string;
  max: number;
  min: number;
  precision: number;
  value: string | number | boolean;
  topic?: string;
  error: string;
  meta: JsonObject;

  markup: {
    title: {
      ru: string;
      en: string;
    };
    description: string;
    order: number;
    color: string;
  };

  labels: string[];
};

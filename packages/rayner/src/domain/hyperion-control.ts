import { JsonObject } from '../helpers/json-types';

export type HyperionDeviceControl = {
  id: string;
  title: {
    ru: string;
    en: string;
  };
  order: number;
  readonly: boolean;
  type: string;
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

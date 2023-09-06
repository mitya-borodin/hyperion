import { JsonObject, JsonValue } from '../helpers/json-types';

export type HyperionDevice = {
  id: string;
  driver: string;
  title: {
    ru: string;
    en: string;
  };
  error: JsonValue;
  meta: JsonObject;
  controls: HyperionDeviceControl[];
};

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
};

import { JsonObject, JsonValue } from '../helpers/json-types';

import { HyperionDeviceControl } from './hyperion-control';

export type HyperionDevice = {
  id: string;
  driver: string;
  title: {
    ru: string;
    en: string;
  };
  error: JsonValue;
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

  controls: HyperionDeviceControl[];
};

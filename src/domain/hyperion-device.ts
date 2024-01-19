import { JsonObject, JsonValue } from '../helpers/json-types';

import { HyperionDeviceControl } from './hyperion-control';

export type HyperionDevice = {
  id: string;

  title: {
    ru: string;
    en: string;
  };
  order: number;

  driver: string;

  error: JsonValue;

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

  controls: HyperionDeviceControl[];
};

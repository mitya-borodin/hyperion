import { JsonObject, JsonValue } from '../helpers/json-types';

export type WirenboardDevice = {
  id: string;
  meta?: {
    driver?: string;
    title?: {
      ru?: string;
      en?: string;
    };
  };
  error?: JsonValue;
  controls?: {
    [id: string]: {
      title?: {
        ru?: string;
        en?: string;
      };
      order?: number;
      readonly?: boolean;
      type?: string;
      units?: string;
      max?: number;
      min?: number;
      precision?: number;
      value?: string | number | boolean;
      topic?: string;
      error?: string;
      meta?: JsonObject;
    };
  };
};

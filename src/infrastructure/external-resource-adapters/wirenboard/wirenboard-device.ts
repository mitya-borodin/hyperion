import { JsonObject, JsonValue } from '../../../helpers/json-types';

export type WirenboardDevice = {
  id: string;
  driver?: string;
  title?: {
    ru?: string;
    en?: string;
  };
  error?: JsonValue;
  meta?: JsonObject;
  controls?: {
    [id: string]: {
      id: string;
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
      value?: string;
      topic?: string;
      error?: string;
      meta?: JsonObject;
    };
  };
};

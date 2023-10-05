import { JsonValue } from '../helpers/json-types';

export enum SettingType {
  SEED_IS_COMPLETE = 'SEED_IS_COMPLETE',
}

export type Settings = {
  [key in SettingType]?: JsonValue;
};

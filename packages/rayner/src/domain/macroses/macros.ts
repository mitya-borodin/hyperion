import { JsonObject } from '../../helpers/json-types';

export enum MacrosType {
  LIGHTING = 'LIGHTING',
}

export enum ControlType {
  SWITCH = 'switch',
  ILLUMINATION = 'lux',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Macros<T extends MacrosType, S extends JsonObject, O extends JsonObject> = {
  id: string;

  name: string;
  description: string;
  type: T;
  labels: string[];

  settings: S;
  output: O;

  createdAt: Date;
  updatedAt: Date;
};

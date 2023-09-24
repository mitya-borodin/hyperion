import { JsonObject } from '../../helpers/json-types';

export enum MacrosType {
  LIGHTING = 'LIGHTING',
  MANUAL_LIGHTING_SWITCH = 'MANUAL_LIGHTING_SWITCH',
}

export enum ControlType {
  SWITCH = 'switch',
  ILLUMINATION = 'lux',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Macros<
  TYPE extends MacrosType,
  STATE extends JsonObject,
  SETTINGS extends JsonObject,
  OUTPUT extends JsonObject,
> = {
  id: string;

  type: TYPE;

  name: string;
  description: string;

  labels: string[];

  state: STATE;
  settings: SETTINGS;
  output: OUTPUT;

  createdAt: Date;
  updatedAt: Date;
};

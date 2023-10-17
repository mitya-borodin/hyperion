import { JsonObject } from '../../helpers/json-types';
import { HyperionDeviceControl } from '../hyperion-control';

export enum MacrosType {
  LIGHTING = 'LIGHTING',
  HEATING = 'HEATING',
}

export type MacrosAccept = {
  previous: Map<string, HyperionDeviceControl>;
  controls: Map<string, HyperionDeviceControl>;
};

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
  settings: SETTINGS;
  createdAt: Date;

  state: STATE;
  output: OUTPUT;

  setState(state: STATE): void;
  accept(parameters: MacrosAccept): void;
};

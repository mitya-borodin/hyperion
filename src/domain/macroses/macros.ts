import { JsonObject } from '../../helpers/json-types';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

export enum MacrosType {
  LIGHTING = 'LIGHTING',
  CLIMATE = 'CLIMATE',
  HEATING_CABLE = 'HEATING_CABLE',
  GATE_OPENING = 'GATE_OPENING',
  CURTAINS_OPENING = 'CURTAINS_OPENING',
  WATER_SUPPLY = 'WATER_SUPPLY',
  HEATED_TOWEL_RAILS = 'HEATED_TOWEL_RAILS',
}

export type MacrosAccept = {
  devices: Map<string, HyperionDevice>;
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

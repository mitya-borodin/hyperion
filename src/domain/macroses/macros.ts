import { JsonObject } from '../../helpers/json-types';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

export enum MacrosType {
  LIGHTING = 'LIGHTING',
  CURTAINS_OPENING = 'CURTAINS_OPENING',
  HEATING = 'HEATING',
  WATER_SUPPLY = 'WATER_SUPPLY',
  HEATED_TOWEL_RAILS = 'HEATED_TOWEL_RAILS',
  VENTILATION = 'VENTILATION',
  HUMIDIFICATION = 'HUMIDIFICATION',
  CONDITIONING = 'CONDITIONING',
  HEATING_CABLE = 'HEATING_CABLE',
  GATE_OPENING = 'GATE_OPENING',
  SECURITY = 'SECURITY',
  ACCOUNTING = 'ACCOUNTING',
  AUTOMATIC_RESERVE_ENTRY = 'AUTOMATIC_RESERVE_ENTRY',
  MASTER_SWITCH = 'MASTER_SWITCH',
}

export type MacrosAccept = {
  devices: Map<string, HyperionDevice>;
  previous: Map<string, HyperionDeviceControl>;
  controls: Map<string, HyperionDeviceControl>;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Macros<TYPE extends MacrosType, STATE extends JsonObject, SETTINGS extends JsonObject> = {
  id: string;
  type: TYPE;
  name: string;
  description: string;
  labels: string[];
  settings: SETTINGS;
  state: STATE;

  setState(state: STATE): void;
  accept(parameters: MacrosAccept): void;
  toJS(): {
    id: string;
    name: string;
    description: string;
    type: TYPE;
    labels: string[];
    settings: SETTINGS;
    state: STATE;
  };
};

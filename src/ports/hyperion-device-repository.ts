/* eslint-disable @typescript-eslint/naming-convention */
import { HardwareDevice } from '../domain/hardware-device';
import { HyperionDeviceControl } from '../domain/hyperion-control';
import { HyperionDevice } from '../domain/hyperion-device';

export type MarkupHyperionDevice = {
  deviceId: string;

  markup?: {
    title?: {
      ru?: string;
      en?: string;
    };
    order?: number;
    color?: string;
  };

  labels?: string[];
};

export type MarkupHyperionControl = {
  deviceId: string;
  controlId: string;

  markup?: {
    title?: {
      ru?: string;
      en?: string;
    };
    order?: number;
    color?: string;
  };

  labels?: string[];
};

export type SetControlValue = {
  deviceId: string;
  controlId: string;

  value: string;
};

export type HyperionStateUpdate = {
  previous: Map<string, HyperionDeviceControl>;
  current: HyperionDevice;

  devices: Map<string, HyperionDevice>;
  controls: Map<string, HyperionDeviceControl>;
};

export type HyperionState = {
  devices: Map<string, HyperionDevice>;
  controls: Map<string, HyperionDeviceControl>;
};

export interface IHyperionDeviceRepository {
  apply(hardwareDevice: HardwareDevice): Error | HyperionStateUpdate;

  getHyperionState(bypass?: boolean): Promise<HyperionState>;

  markupDevice(parameters: MarkupHyperionDevice): Promise<Error | HyperionStateUpdate>;

  markupControl(parameters: MarkupHyperionControl): Promise<Error | HyperionStateUpdate>;

  setControlValue(parameters: SetControlValue): Promise<Error | HyperionStateUpdate>;
}

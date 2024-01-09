/* eslint-disable @typescript-eslint/naming-convention */
import { HardwareDevice } from '../domain/hardware-device';
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

export interface IHyperionDeviceRepository {
  apply(hardwareDevice: HardwareDevice): Promise<Error | HyperionDevice>;

  getAll(): Promise<Error | HyperionDevice[]>;

  markupDevice(parameters: MarkupHyperionDevice): Promise<Error | HyperionDevice>;

  markupControl(parameters: MarkupHyperionControl): Promise<Error | HyperionDevice>;

  setControlValue(parameters: SetControlValue): Promise<Error | HyperionDevice>;
}

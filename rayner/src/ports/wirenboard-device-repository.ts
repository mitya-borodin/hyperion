/* eslint-disable @typescript-eslint/naming-convention */
import { HyperionDevice } from '../domain/hyperion-device';
import { WirenboardDevice } from '../infrastructure/external-resource-adapters/wirenboard/wirenboard-device';

export type MarkupWirenboardDevice = {
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

export type MarkupWirenboardControl = {
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

export interface IWirenboardDeviceRepository {
  apply(wirenboardDevice: WirenboardDevice): Promise<Error | HyperionDevice>;

  getAll(): Promise<Error | HyperionDevice[]>;

  markupDevice(parameters: MarkupWirenboardDevice): Promise<Error | HyperionDevice>;

  markupControl(parameters: MarkupWirenboardControl): Promise<Error | HyperionDevice>;

  setControlValue(parameters: SetControlValue): Promise<Error | HyperionDevice>;
}

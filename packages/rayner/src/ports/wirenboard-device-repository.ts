/* eslint-disable @typescript-eslint/naming-convention */
import { HyperionDevice } from '../domain/hyperion-device';
import { WirenboardDevice } from '../infrastructure/external-resource-adapters/wirenboard/wirenboard-device';

export interface IWirenboardDeviceRepository {
  apply(wirenboardDevice: WirenboardDevice): Promise<Error | HyperionDevice>;
}

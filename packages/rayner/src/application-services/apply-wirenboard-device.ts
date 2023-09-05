import EventEmitter from 'node:events';

import { Logger } from 'pino';

import {
  WirenboardDevice,
  WirenboardDeviceEvent,
} from '../infrastructure/external-resource-adapters/wirenboard/wirenboard-device';
import { IWirenboardDeviceRepository } from '../ports/wirenboard-device-repository';

type ApplyWirenboardDevice = {
  logger: Logger;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
  pubSub: EventEmitter;
};

export const runCollectWirenboardDeviceData = ({
  logger,
  wirenboardDeviceRepository,
  pubSub,
}: ApplyWirenboardDevice) => {
  const wirenboardDeviceHandler = async (wirenboardDevice: WirenboardDevice) => {
    const hyperionDevice = await wirenboardDeviceRepository.apply(wirenboardDevice);

    if (hyperionDevice instanceof Error) {
      return hyperionDevice;
    }
  };

  pubSub.on(WirenboardDeviceEvent.APPEARED, wirenboardDeviceHandler);

  return () => {
    pubSub.off(WirenboardDeviceEvent.APPEARED, wirenboardDeviceHandler);
  };
};

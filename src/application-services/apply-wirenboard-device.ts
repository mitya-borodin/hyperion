import EventEmitter from 'node:events';

import debug from 'debug';

import { EventBus } from '../domain/event-bus';
import { WirenboardDevice } from '../infrastructure/external-resource-adapters/wirenboard/wirenboard-device';
import { emitGqlDeviceSubscriptionEvent } from '../interfaces/http/graphql/helpers/emit-gql-device-subscription-event';
import { SubscriptionDeviceType } from '../interfaces/http/graphql/subscription';
import { IWirenboardDeviceRepository } from '../ports/wirenboard-device-repository';

const logger = debug('run-collect-wirenboard-device-data');

type ApplyWirenboardDevice = {
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
  eventBus: EventEmitter;
};

export const runCollectWirenboardDeviceData = ({ wirenboardDeviceRepository, eventBus }: ApplyWirenboardDevice) => {
  const wirenboardDeviceHandler = async (wirenboardDevice: WirenboardDevice) => {
    const hyperionDevice = await wirenboardDeviceRepository.apply(wirenboardDevice);

    if (hyperionDevice instanceof Error) {
      return hyperionDevice;
    }

    eventBus.emit(EventBus.HD_APPEARED, hyperionDevice);

    emitGqlDeviceSubscriptionEvent({
      eventBus,
      hyperionDevice,
      type: SubscriptionDeviceType.APPEARED,
    });
  };

  eventBus.on(EventBus.WB_APPEARED, wirenboardDeviceHandler);

  return () => {
    eventBus.off(EventBus.WB_APPEARED, wirenboardDeviceHandler);
  };
};

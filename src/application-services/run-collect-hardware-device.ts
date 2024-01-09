import EventEmitter from 'node:events';

import { EventBus } from '../domain/event-bus';
import { HardwareDevice } from '../domain/hardware-device';
import { emitGqlDeviceSubscriptionEvent } from '../interfaces/http/graphql/helpers/emit-gql-device-subscription-event';
import { SubscriptionDeviceType } from '../interfaces/http/graphql/subscription';
import { IHyperionDeviceRepository } from '../ports/hyperion-device-repository';

type RunCollectHardwareDevice = {
  hyperionDeviceRepository: IHyperionDeviceRepository;
  eventBus: EventEmitter;
};

export const runCollectHardwareDevice = ({ hyperionDeviceRepository, eventBus }: RunCollectHardwareDevice) => {
  const hardwareDeviceHandler = async (hardwareDevice: HardwareDevice) => {
    const hyperionDevice = await hyperionDeviceRepository.apply(hardwareDevice);

    if (hyperionDevice instanceof Error) {
      return hyperionDevice;
    }

    eventBus.emit(EventBus.HYPERION_DEVICE_APPEARED, hyperionDevice);

    emitGqlDeviceSubscriptionEvent({
      eventBus,
      hyperionDevice,
      type: SubscriptionDeviceType.APPEARED,
    });
  };

  eventBus.on(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDeviceHandler);

  return () => {
    eventBus.off(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDeviceHandler);
  };
};

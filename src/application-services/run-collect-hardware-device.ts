import EventEmitter from 'node:events';

import { compareAsc, differenceInMilliseconds, subSeconds } from 'date-fns';
import debug from 'debug';

import { EventBus } from '../domain/event-bus';
import { HardwareDevice } from '../domain/hardware-device';
import { stringify } from '../helpers/json-stringify';
import { emitGqlDeviceSubscriptionEvent } from '../interfaces/http/graphql/helpers/emit-gql-device-subscription-event';
import { SubscriptionDeviceType } from '../interfaces/http/graphql/subscription';
import { IHyperionDeviceRepository } from '../ports/hyperion-device-repository';

const logger = debug('hyperion-run-collect-hardware-device');

type RunCollectHardwareDevice = {
  hyperionDeviceRepository: IHyperionDeviceRepository;
  eventBus: EventEmitter;
};

let lastHardwareDeviceAppeared: Date = new Date();

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

    lastHardwareDeviceAppeared = new Date();
  };

  const healthcheck = setInterval(() => {
    logger('Last hardware device was appeared at 🧯 🧯 🧯');
    logger(
      stringify({
        isAlive: compareAsc(lastHardwareDeviceAppeared, subSeconds(new Date(), 30)) === 1,
        lastHardwareDeviceAppeared,
        diff: `${differenceInMilliseconds(new Date(), lastHardwareDeviceAppeared)} ms`,
      }),
    );
  }, 10_000);

  eventBus.on(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDeviceHandler);

  return () => {
    clearInterval(healthcheck);

    eventBus.off(EventBus.HARDWARE_DEVICE_APPEARED, hardwareDeviceHandler);
  };
};

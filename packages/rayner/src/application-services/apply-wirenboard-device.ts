import EventEmitter from 'node:events';

import { Logger } from 'pino';

import { EventBus } from '../domain/event-bus';
import { ErrorCode, ErrorMessage } from '../helpers/error-type';
import { WirenboardDevice } from '../infrastructure/external-resource-adapters/wirenboard/wirenboard-device';
import { toGraphQlSubscriptionDevice } from '../interfaces/http/graphql/mappers/to-graphql-subscription-device';
import { SubscriptionDeviceType } from '../interfaces/http/graphql/subscription';
import { IWirenboardDeviceRepository } from '../ports/wirenboard-device-repository';

type ApplyWirenboardDevice = {
  logger: Logger;
  wirenboardDeviceRepository: IWirenboardDeviceRepository;
  eventBus: EventEmitter;
};

export const runCollectWirenboardDeviceData = ({
  logger,
  wirenboardDeviceRepository,
  eventBus,
}: ApplyWirenboardDevice) => {
  const wirenboardDeviceHandler = async (wirenboardDevice: WirenboardDevice) => {
    const hyperionDevice = await wirenboardDeviceRepository.apply(wirenboardDevice);

    if (hyperionDevice instanceof Error) {
      return hyperionDevice;
    }

    eventBus.emit(
      EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
      toGraphQlSubscriptionDevice({
        devices: [hyperionDevice],
        type: SubscriptionDeviceType.APPEARED,
        error: {
          code: ErrorCode.ALL_RIGHT,
          message: ErrorMessage.ALL_RIGHT,
        },
      }),
    );
  };

  eventBus.on(EventBus.WB_APPEARED, wirenboardDeviceHandler);

  return () => {
    eventBus.off(EventBus.WB_APPEARED, wirenboardDeviceHandler);
  };
};

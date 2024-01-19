import EventEmitter from 'node:events';

import { EventBus } from '../../../../domain/event-bus';
import { HyperionDevice } from '../../../../domain/hyperion-device';
import { ErrorCode, ErrorMessage } from '../../../../helpers/error-type';
import { toGraphQlSubscriptionDevice } from '../mappers/to-graphql-subscription-device';
import { SubscriptionDeviceType } from '../subscription';

type EmitGqlDeviceSubscriptionEvent = {
  eventBus: EventEmitter;
  hyperionDevice: HyperionDevice;
  type: SubscriptionDeviceType;
};

export const emitGqlDeviceSubscriptionEvent = ({ eventBus, hyperionDevice, type }: EmitGqlDeviceSubscriptionEvent) => {
  eventBus.emit(
    EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
    toGraphQlSubscriptionDevice({
      devices: [hyperionDevice],
      type,
      error: {
        code: ErrorCode.ALL_RIGHT,
        message: ErrorMessage.ALL_RIGHT,
      },
    }),
  );
};

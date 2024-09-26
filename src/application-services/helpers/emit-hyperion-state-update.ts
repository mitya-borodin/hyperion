import EventEmitter from 'node:events';

import { EventBus } from '../../domain/event-bus';
import { HyperionStateUpdate } from '../../ports/hyperion-device-port';

type EmitGqlDeviceSubscriptionEvent = {
  eventBus: EventEmitter;
  hyperionStateUpdate: HyperionStateUpdate;
};

export const emitHyperionStateUpdate = ({ eventBus, hyperionStateUpdate }: EmitGqlDeviceSubscriptionEvent) => {
  eventBus.emit(EventBus.HYPERION_STATE, hyperionStateUpdate);
};

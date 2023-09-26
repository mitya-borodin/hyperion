import EventEmitter from 'node:events';

import { EventBus } from '../../../domain/event-bus';

import { PublishWirenboardMessage } from '.';

type EmitWirenboardMessage = {
  eventBus: EventEmitter;
  topic: string;
  message: string;
};

export const emitWirenboardMessage = ({ eventBus, topic, message }: EmitWirenboardMessage) => {
  eventBus.emit(EventBus.WB_PUBLISH_MESSAGE, {
    topic,
    message,
  } as PublishWirenboardMessage);
};

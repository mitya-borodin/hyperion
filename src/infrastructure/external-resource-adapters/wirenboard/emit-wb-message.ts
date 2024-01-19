import EventEmitter from 'node:events';

import { EventBus } from '../../../domain/event-bus';
import { MqttMessage } from '../publish-mqtt-message';

type EmitMessage = {
  eventBus: EventEmitter;
  topic: string;
  message: string;
};

export const emitWirenboardMessage = ({ eventBus, topic, message }: EmitMessage) => {
  eventBus.emit(EventBus.WB_PUBLISH_MESSAGE, {
    topic,
    message,
  } as MqttMessage);
};

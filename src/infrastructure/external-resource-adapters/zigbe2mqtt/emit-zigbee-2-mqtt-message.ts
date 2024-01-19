import EventEmitter from 'node:events';

import { EventBus } from '../../../domain/event-bus';
import { MqttMessage } from '../publish-mqtt-message';

type EmitMessage = {
  eventBus: EventEmitter;
  topic: string;
  message: string;
};

export const emitZigbee2mqttMessage = ({ eventBus, topic, message }: EmitMessage) => {
  eventBus.emit(EventBus.ZIGBEE_2_MQTT_SEND_MESSAGE, {
    topic,
    message,
  } as MqttMessage);
};

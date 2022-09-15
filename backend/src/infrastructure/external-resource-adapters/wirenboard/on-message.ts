import EventEmitter from "events";

import { onAcDetectorMessage } from "./devices/ac-detector";
import { onAnalogZeroTenVoltControllerMessage } from "./devices/analog-0-10-volt-controller";
import { onBoilerMessage } from "./devices/boiler";
import { onCounterMessage } from "./devices/counter";
import { onTemperatureSensorMessage } from "./devices/on-temperature-sensor";
import { onRelayMessage } from "./devices/relays";
import { onSolidRelayMessage } from "./devices/solid-relay";
import { onTwoPinRelayMessage } from "./devices/two-pin-relay";
import { isNeedToSkip } from "./on-message-utils";

export const onMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (isNeedToSkip(topic)) {
    return;
  }

  onCounterMessage(eventemitter, topic, message);

  onAcDetectorMessage(eventemitter, topic, message);

  onSolidRelayMessage(eventemitter, topic, message);

  onAnalogZeroTenVoltControllerMessage(eventemitter, topic, message);

  onTwoPinRelayMessage(eventemitter, topic, message);

  onRelayMessage(eventemitter, topic, message);

  onTemperatureSensorMessage(eventemitter, topic, message);

  onBoilerMessage(eventemitter, topic, message);
};

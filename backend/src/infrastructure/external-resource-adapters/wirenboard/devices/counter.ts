import EventEmitter from "events";

import debug from "debug";

import { booleanProperty } from "../on-message-utils";
import { WBIO_1_GPIO_TOPIC, WBIO_2_GPIO_TOPIC, WBIO_3_GPIO_TOPIC } from "../topics";

const logger = debug("wirenboard:counter");

/**
 * Счетчик позволяет реализовать кнопки, датчики протечки, герконы ( датчики открывания дверей ), датчик протечки
 */
export const onCounterMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBIO_1_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_1_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT1_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`COUNTER_${result.pin}`, result.value);
  }

  if (topic.includes(WBIO_2_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_2_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT2_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`COUNTER_${result.pin + 14}`, result.value);
  }

  if (topic.includes(WBIO_3_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_3_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT3_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`COUNTER_${result.pin + 28}`, result.value);
  }
};

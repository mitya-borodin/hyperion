import EventEmitter from "events";

import debug from "debug";

import { booleanProperty } from "../on-message-utils";
import { WBIO_1_GPIO_TOPIC, WBIO_2_GPIO_TOPIC, WBIO_3_GPIO_TOPIC } from "../topics";

const logger = debug("wirenboard:counter");

export enum COUNTER {
  COUNTER_1 = "COUNTER_1",
  COUNTER_2 = "COUNTER_2",
  COUNTER_3 = "COUNTER_3",
  COUNTER_4 = "COUNTER_4",
  COUNTER_5 = "COUNTER_5",
  COUNTER_6 = "COUNTER_6",
  COUNTER_7 = "COUNTER_7",
  COUNTER_8 = "COUNTER_8",
  COUNTER_9 = "COUNTER_9",
  COUNTER_10 = "COUNTER_10",
  COUNTER_11 = "COUNTER_11",
  COUNTER_12 = "COUNTER_12",
  COUNTER_13 = "COUNTER_13",
  COUNTER_14 = "COUNTER_14",
  COUNTER_15 = "COUNTER_15",
  COUNTER_16 = "COUNTER_16",
  COUNTER_17 = "COUNTER_17",
  COUNTER_18 = "COUNTER_18",
  COUNTER_19 = "COUNTER_19",
  COUNTER_20 = "COUNTER_20",
  COUNTER_21 = "COUNTER_21",
  COUNTER_22 = "COUNTER_22",
  COUNTER_23 = "COUNTER_23",
  COUNTER_24 = "COUNTER_24",
  COUNTER_25 = "COUNTER_25",
  COUNTER_26 = "COUNTER_26",
  COUNTER_27 = "COUNTER_27",
  COUNTER_28 = "COUNTER_28",
  COUNTER_29 = "COUNTER_29",
  COUNTER_30 = "COUNTER_30",
  COUNTER_31 = "COUNTER_31",
  COUNTER_32 = "COUNTER_32",
  COUNTER_33 = "COUNTER_33",
  COUNTER_34 = "COUNTER_34",
  COUNTER_35 = "COUNTER_35",
  COUNTER_36 = "COUNTER_36",
  COUNTER_37 = "COUNTER_37",
  COUNTER_38 = "COUNTER_38",
  COUNTER_39 = "COUNTER_39",
  COUNTER_40 = "COUNTER_40",
  COUNTER_41 = "COUNTER_41",
  COUNTER_42 = "COUNTER_42",
}

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

import EventEmitter from "events";

import debug from "debug";

import { booleanProperty } from "../on-message-utils";
import { WBIO_4_GPIO_TOPIC } from "../topics";

const logger = debug("wirenboard:ac-detector");

export enum AC_DETECTOR {
  /**
   * Наличие напряжения на первой фазе
   */
  AC_DETECTOR_1 = "AC_DETECTOR_1",

  /**
   * Наличие напряжения на второй фазе
   */
  AC_DETECTOR_2 = "AC_DETECTOR_2",

  /**
   * Наличие напряжения на третьей фазе
   */
  AC_DETECTOR_3 = "AC_DETECTOR_3",

  /**
   * Наличие напряжения на ( Я забыл где :) ), скорее всего после ПЭФ для АВР
   */
  AC_DETECTOR_4 = "AC_DETECTOR_4",

  /**
   * Наличие напряжения на первой фазе после АВР
   */
  AC_DETECTOR_5 = "AC_DETECTOR_5",

  /**
   * Наличие напряжения на второй фазе после АВР
   */
  AC_DETECTOR_6 = "AC_DETECTOR_6",

  /**
   * Наличие напряжения на третьей фазе после АВР
   */
  AC_DETECTOR_7 = "AC_DETECTOR_7",

  /**
   * Наличие напряжения на не отключаемой линии после ПЭФ
   */
  AC_DETECTOR_8 = "AC_DETECTOR_8",
}

/**
 * Детектор переменного напряжения позволяет определять наличие 220В на линии.
 */
export const onAcDetectorMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBIO_4_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_4_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-HVD-8 EXT4_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`AC_DETECTOR_${result.pin}`, result.value);
  }
};

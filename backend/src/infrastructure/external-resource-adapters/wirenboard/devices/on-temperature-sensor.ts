import EventEmitter from "events";

import debug from "debug";

import { numberProperty } from "../on-message-utils";
import {
  WB_W1_UP_TOPIC,
  WB_W1_DOWN_TOPIC,
  WB_M1W2_30_TOPIC,
  WB_M1W2_41_TOPIC,
  WB_M1W2_56_TOPIC,
  WB_M1W2_69_TOPIC,
  WB_M1W2_91_TOPIC,
  WB_M1W2_97_TOPIC,
  WB_M1W2_153_TOPIC,
  WB_M1W2_168_TOPIC,
  WB_M1W2_170_TOPIC,
  WB_M1W2_171_TOPIC,
  WB_M1W2_172_TOPIC,
  WB_M1W2_173_TOPIC,
  WB_M1W2_174_TOPIC,
  WB_M1W2_210_TOPIC,
} from "../topics";

const logger = debug("wirenboard:temperature-sensor");

export enum TEMPERATURE_SENSOR {
  /**
   * Температура верха щита 28-00000d885de4 (W1)
   */
  TEMPERATURE_SENSOR_1 = "TEMPERATURE_SENSOR_1",

  /**
   * Температура низа щита 28-00000d882feb (W2)
   */
  TEMPERATURE_SENSOR_2 = "TEMPERATURE_SENSOR_2",

  /**
   * Температура подачи вентиляции wb-m1w2_30 (W1)
   */
  TEMPERATURE_SENSOR_3 = "TEMPERATURE_SENSOR_3",

  /**
   * Температура обратки вентиляции wb-m1w2_30 (W2)
   */
  TEMPERATURE_SENSOR_4 = "TEMPERATURE_SENSOR_4",

  /**
   * Температура подачи бойлера wb-m1w2_41 (W1)
   */
  TEMPERATURE_SENSOR_5 = "TEMPERATURE_SENSOR_5",

  /**
   * Температура обратки бойлера wb-m1w2_41 (W2)
   */
  TEMPERATURE_SENSOR_6 = "TEMPERATURE_SENSOR_6",

  /**
   * Температура подачи радиаторов wb-m1w2_56 (W1)
   */
  TEMPERATURE_SENSOR_7 = "TEMPERATURE_SENSOR_7",

  /**
   * Температура обратки радиаторов wb-m1w2_56 (W2)
   */
  TEMPERATURE_SENSOR_8 = "TEMPERATURE_SENSOR_8",

  /**
   * Температура подачи теплого пола wb-m1w2_69 (W1)
   */
  TEMPERATURE_SENSOR_9 = "TEMPERATURE_SENSOR_9",

  /**
   * Температура обратки теплого пола wb-m1w2_69 (W2)
   */
  TEMPERATURE_SENSOR_10 = "TEMPERATURE_SENSOR_10",

  /**
   * Температура воздуха до нагрева wb-m1w2_91 (W1)
   */
  TEMPERATURE_SENSOR_11 = "TEMPERATURE_SENSOR_11",

  /**
   * Температура воздуха после первого калорифера wb-m1w2_91 (W2)
   */
  TEMPERATURE_SENSOR_12 = "TEMPERATURE_SENSOR_12",

  /**
   * Температура воздуха после второго калорифера wb-m1w2_97 (W1)
   */
  TEMPERATURE_SENSOR_13 = "TEMPERATURE_SENSOR_13",

  /**
   * Температура воздуха на улице wb-m1w2_97 (W2)
   */
  TEMPERATURE_SENSOR_14 = "TEMPERATURE_SENSOR_14",

  /**
   * Температура пола в гостиной wb-m1w2_153 (W1)
   */
  TEMPERATURE_SENSOR_15 = "TEMPERATURE_SENSOR_15",

  /**
   * Температура середины стены в гостиной wb-m1w2_153 (W2)
   */
  TEMPERATURE_SENSOR_16 = "TEMPERATURE_SENSOR_16",

  /**
   * Температура пола игровая wb-m1w2_168 (W1)
   */
  TEMPERATURE_SENSOR_17 = "TEMPERATURE_SENSOR_17",

  /**
   * Температура середины стены в игровой wb-m1w2_168 (W2)
   */
  TEMPERATURE_SENSOR_18 = "TEMPERATURE_SENSOR_18",

  /**
   * Температура пола ванная wb-m1w2_170 (W1)
   */
  TEMPERATURE_SENSOR_19 = "TEMPERATURE_SENSOR_19",

  /**
   * Температура середины стены в ванной wb-m1w2_170 (W2)
   */
  TEMPERATURE_SENSOR_20 = "TEMPERATURE_SENSOR_20",

  /**
   * Температура пола спальня wb-m1w2_171 (W1)
   */
  TEMPERATURE_SENSOR_21 = "TEMPERATURE_SENSOR_21",

  /**
   * Температура середины стены в спальне wb-m1w2_171 (W2)
   */
  TEMPERATURE_SENSOR_22 = "TEMPERATURE_SENSOR_22",

  /**
   * Температура пола прихожая wb-m1w2_172 (W1)
   */
  TEMPERATURE_SENSOR_23 = "TEMPERATURE_SENSOR_23",

  /**
   * Температура середины стены в прихожей wb-m1w2_172 (W2)
   */
  TEMPERATURE_SENSOR_24 = "TEMPERATURE_SENSOR_24",

  /**
   * Температура пола кабинет wb-m1w2_173 (W1)
   */
  TEMPERATURE_SENSOR_25 = "TEMPERATURE_SENSOR_25",

  /**
   * Температура середины стены в кабинете wb-m1w2_173 (W2)
   */
  TEMPERATURE_SENSOR_26 = "TEMPERATURE_SENSOR_26",

  /**
   * Температура пола хозяйственная wb-m1w2_174 (W1)
   */
  TEMPERATURE_SENSOR_27 = "TEMPERATURE_SENSOR_27",

  /**
   * Температура середины стены в хозяйственной wb-m1w2_174 (W2)
   */
  TEMPERATURE_SENSOR_28 = "TEMPERATURE_SENSOR_28",

  /**
   * Температура пола технической wb-m1w2_210 (W1)
   */
  TEMPERATURE_SENSOR_29 = "TEMPERATURE_SENSOR_29",

  /**
   * Температура середины стены в технической wb-m1w2_210 (W2)
   */
  TEMPERATURE_SENSOR_30 = "TEMPERATURE_SENSOR_30",
}

export const onTemperatureSensorMessage = (
  eventemitter: EventEmitter,
  topic: string,
  message: Buffer,
) => {
  if (topic.includes(WB_W1_UP_TOPIC)) {
    const result = numberProperty(topic, message, WB_W1_UP_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-W1-UP Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_1, result.value);
  }

  if (topic.includes(WB_W1_DOWN_TOPIC)) {
    const result = numberProperty(topic, message, WB_W1_DOWN_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-W1-DOWN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_2, result.value);
  }

  if (topic.includes(WB_M1W2_30_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_30_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-30 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_3, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_4, result.value);
  }

  if (topic.includes(WB_M1W2_41_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_41_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-41 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_5, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_6, result.value);
  }

  if (topic.includes(WB_M1W2_56_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_56_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-56 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_7, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_8, result.value);
  }

  if (topic.includes(WB_M1W2_69_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_69_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-69 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_9, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_10, result.value);
  }

  if (topic.includes(WB_M1W2_91_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_91_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-91 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_11, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_12, result.value);
  }

  if (topic.includes(WB_M1W2_97_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_97_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-97 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_13, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_14, result.value);
  }

  if (topic.includes(WB_M1W2_153_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_153_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-153 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_15, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_16, result.value);
  }

  if (topic.includes(WB_M1W2_168_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_168_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-168 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_17, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_18, result.value);
  }

  if (topic.includes(WB_M1W2_170_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_170_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-170 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_19, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_20, result.value);
  }

  if (topic.includes(WB_M1W2_171_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_171_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-171 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_21, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_22, result.value);
  }

  if (topic.includes(WB_M1W2_172_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_172_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-172 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_23, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_24, result.value);
  }

  if (topic.includes(WB_M1W2_173_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_173_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-173 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_25, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_26, result.value);
  }

  if (topic.includes(WB_M1W2_174_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_174_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-174 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_27, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_28, result.value);
  }

  if (topic.includes(WB_M1W2_210_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_210_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-210 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    /**
     * ! Тут каким то образом должно быть два измерения температуры.
     */
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_29, result.value);
    eventemitter.emit(TEMPERATURE_SENSOR.TEMPERATURE_SENSOR_30, result.value);
  }
};

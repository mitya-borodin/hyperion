import EventEmitter from "events";

import debug from "debug";

import { TEMPERATURE_SENSOR } from "../../../../domain/wirenboard/on-temperature-sensor";
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

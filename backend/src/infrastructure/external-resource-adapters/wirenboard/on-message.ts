import EventEmitter from "events";

import debug from "debug";

import { onDirectionRelayMessage } from "./direction-relay";
import {
  isNeedToSkip,
  booleanProperty,
  numberProperty,
  directionRelayProperty,
  boilerProperty,
} from "./on-message-utils";
import { onRelayMessage } from "./relays";
import {
  WBE2_I_EBUS_TOPIC,
  WBE2_I_OPENTHERM_TOPIC,
  WBIO_1_GPIO_TOPIC,
  WBIO_1_R10R_4_TOPIC,
  WBIO_2_GPIO_TOPIC,
  WBIO_2_R10R_4_TOPIC,
  WBIO_3_GPIO_TOPIC,
  WBIO_3_R10R_4_TOPIC,
  WBIO_4_GPIO_TOPIC,
  WBIO_4_R10R_4_TOPIC,
  WBIO_5_GPIO_TOPIC,
  WBIO_6_GPIO_TOPIC,
  WBIO_7_GPIO_TOPIC,
  WBIO_8_DAC_TOPIC,
  WB_M1W2_153_TOPIC,
  WB_M1W2_168_TOPIC,
  WB_M1W2_170_TOPIC,
  WB_M1W2_171_TOPIC,
  WB_M1W2_172_TOPIC,
  WB_M1W2_173_TOPIC,
  WB_M1W2_174_TOPIC,
  WB_M1W2_210_TOPIC,
  WB_M1W2_30_TOPIC,
  WB_M1W2_41_TOPIC,
  WB_M1W2_56_TOPIC,
  WB_M1W2_69_TOPIC,
  WB_M1W2_91_TOPIC,
  WB_M1W2_97_TOPIC,
  WB_W1_DOWN_TOPIC,
  WB_W1_UP_TOPIC,
} from "./topics";

const logger = debug("wirenboard:on:message");

export const onMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (isNeedToSkip(topic)) {
    return;
  }

  if (topic.includes(WBIO_1_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_1_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT1_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_2_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_2_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT2_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_3_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_3_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-WD-14 EXT3_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_4_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_4_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DI-HVD-8 EXT4_IN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_5_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_5_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-SSR-8 EXT5_K Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_6_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_6_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-SSR-8 EXT6_K Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_7_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_7_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-SSR-8 EXT7_K Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_8_DAC_TOPIC)) {
    const result = numberProperty(topic, message, WBIO_8_DAC_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-AO-10V-8 EXT8_O Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBE2_I_OPENTHERM_TOPIC)) {
    const result = boilerProperty(topic, message, WBE2_I_OPENTHERM_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBE2-I-OPENTHERM Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBE2_I_EBUS_TOPIC)) {
    const result = boilerProperty(topic, message, WBE2_I_EBUS_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBE2-I-EBUS Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  onRelayMessage(eventemitter, topic, message);
  onDirectionRelayMessage(eventemitter, topic, message);

  if (topic.includes(WB_M1W2_30_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_30_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-30 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_41_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_41_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-41 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_56_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_56_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-56 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_69_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_69_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-69 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_91_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_91_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-91 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_97_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_97_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-97 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_153_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_153_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-153 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_168_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_168_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-168 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_170_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_170_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-170 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_171_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_171_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-171 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_172_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_172_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-172 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_173_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_173_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-173 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_174_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_174_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-174 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_M1W2_210_TOPIC)) {
    const result = numberProperty(topic, message, WB_M1W2_210_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-M1W2-210 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_W1_UP_TOPIC)) {
    const result = numberProperty(topic, message, WB_W1_UP_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-W1-UP Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WB_W1_DOWN_TOPIC)) {
    const result = numberProperty(topic, message, WB_W1_DOWN_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WB-W1-DOWN Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }
};

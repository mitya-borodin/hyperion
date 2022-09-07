import EventEmitter from "events";

import debug from "debug";
import { MqttClient } from "mqtt";

import { directionRelayProperty } from "./on-message-utils";
import { publishWirenboardMessage } from "./publish-message";
import {
  WBIO_1_R10R_4_TOPIC,
  WBIO_2_R10R_4_TOPIC,
  WBIO_3_R10R_4_TOPIC,
  WBIO_4_R10R_4_TOPIC,
} from "./topics";

const logger = debug("wirenboard:on:direction-relay:message");

export enum DIRECTION_RELAY {
  DIRECTION_RELAY_1 = "DIRECTION_RELAY_1",
  DIRECTION_RELAY_2 = "DIRECTION_RELAY_2",
  DIRECTION_RELAY_3 = "DIRECTION_RELAY_3",
  DIRECTION_RELAY_4 = "DIRECTION_RELAY_4",
  DIRECTION_RELAY_5 = "DIRECTION_RELAY_5",
  DIRECTION_RELAY_6 = "DIRECTION_RELAY_6",
  DIRECTION_RELAY_7 = "DIRECTION_RELAY_7",
  DIRECTION_RELAY_8 = "DIRECTION_RELAY_8",
  DIRECTION_RELAY_9 = "DIRECTION_RELAY_9",
  DIRECTION_RELAY_10 = "DIRECTION_RELAY_10",
  DIRECTION_RELAY_11 = "DIRECTION_RELAY_11",
  DIRECTION_RELAY_12 = "DIRECTION_RELAY_12",
  DIRECTION_RELAY_13 = "DIRECTION_RELAY_13",
  DIRECTION_RELAY_14 = "DIRECTION_RELAY_14",
  DIRECTION_RELAY_15 = "DIRECTION_RELAY_15",
  DIRECTION_RELAY_16 = "DIRECTION_RELAY_16",
}

export const onDirectionRelayMessage = (
  eventemitter: EventEmitter,
  topic: string,
  message: Buffer,
) => {
  if (topic.includes(WBIO_1_R10R_4_TOPIC)) {
    const result = directionRelayProperty(topic, message, WBIO_1_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-R10R-4 wb-mio-gpio_52:1 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_2_R10R_4_TOPIC)) {
    const result = directionRelayProperty(topic, message, WBIO_2_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-R10R-4 wb-mio-gpio_52:2 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_3_R10R_4_TOPIC)) {
    const result = directionRelayProperty(topic, message, WBIO_3_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-R10R-4 wb-mio-gpio_52:3 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }

  if (topic.includes(WBIO_4_R10R_4_TOPIC)) {
    const result = directionRelayProperty(topic, message, WBIO_4_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-DO-R10R-4 wb-mio-gpio_52:4 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));
  }
};

export const changeDirectionRelays = async (
  client: MqttClient,
  relays: DIRECTION_RELAY[],
  state: "1" | "0",
): Promise<undefined | Error> => {
  const results = await Promise.all(
    relays.map((relay) => changeDirectionRelay(client, relay, state)),
  );

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error("FAILED_CHANGE_DIRECTION_RELAYS");
  }

  return undefined;
};

const changeDirectionRelay = async (
  client: MqttClient,
  relay: DIRECTION_RELAY,
  state: "1" | "0",
) => {
  if (relay === DIRECTION_RELAY.DIRECTION_RELAY_1) {
    return await publishWirenboardMessage(
      client,
      WBIO_1_R10R_4_TOPIC + "DIR1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }
};

export const switchDirectionRelays = async (
  client: MqttClient,
  relays: DIRECTION_RELAY[],
  state: "1" | "0",
): Promise<undefined | Error> => {
  const results = await Promise.all(
    relays.map((relay) => switchDirectionRelay(client, relay, state)),
  );

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error("FAILED_SWITCH_RELAYS");
  }

  return undefined;
};

const switchDirectionRelay = async (
  client: MqttClient,
  relay: DIRECTION_RELAY,
  state: "1" | "0",
) => {
  if (relay === DIRECTION_RELAY.DIRECTION_RELAY_1) {
    return await publishWirenboardMessage(
      client,
      WBIO_1_R10R_4_TOPIC + "ON1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }
};

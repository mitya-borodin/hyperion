import EventEmitter from "events";

import debug from "debug";
import { MqttClient } from "mqtt";

import { ANALOG_0_10_VOLT_CONTROLLER } from "../../../../domain/wirenboard/analog-0-10-volt-controller";
import { numberProperty } from "../on-message-utils";
import { publishWirenboardMessage } from "../publish-message";
import { WBIO_8_DAC_TOPIC } from "../topics";

const logger = debug("wirenboard:analog-0-10-volt-controller");

/**
 * Позволяет управлять устройствами с интерфейсом 0-10V, смесители, вентиляторы.
 */
export const onAnalogZeroTenVoltControllerMessage = (
  eventemitter: EventEmitter,
  topic: string,
  message: Buffer,
) => {
  if (topic.includes(WBIO_8_DAC_TOPIC)) {
    const result = numberProperty(topic, message, WBIO_8_DAC_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("WBIO-AO-10V-8 EXT8_O Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`ANALOG_0_10_VOLT_CONTROLLER_${result.pin}`, result.value);
  }
};

export const setAnalogZeroTenVoltControllerValues = async (
  client: MqttClient,
  relays: ANALOG_0_10_VOLT_CONTROLLER[],
  value: number,
): Promise<undefined | Error> => {
  const results = await Promise.all(
    relays.map((relay) => setAnalogZeroTenVoltControllerValue(client, relay, value)),
  );

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error("FAILED_SWITCH_RELAYS");
  }

  return undefined;
};

const setAnalogZeroTenVoltControllerValue = async (
  client: MqttClient,
  relay: ANALOG_0_10_VOLT_CONTROLLER,
  value: number,
) => {
  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_1) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "1",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_2) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "2",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_3) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "3",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_4) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "4",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_5) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "5",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_6) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "6",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_7) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "7",
      Buffer.from(String(value), "utf8"),
    );
  }

  if (relay === ANALOG_0_10_VOLT_CONTROLLER.ANALOG_0_10_VOLT_CONTROLLER_8) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Не понятно там /on или что-то другое, как будто там просто без /on
       */
      WBIO_8_DAC_TOPIC + "8",
      Buffer.from(String(value), "utf8"),
    );
  }
};

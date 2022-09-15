import debug from "debug";

import { TRUE, FALSE } from "./topics";
import { BoilerProperty, DirectionRelayProperty } from "./types";

const logger = debug("wirenboard:on:message:utils");

export const isNeedToSkip = (topic: string) => {
  return (
    topic.includes("/devices/battery") ||
    topic.includes("/devices/power_status") ||
    topic.includes("/devices/wb-adc") ||
    topic.includes("/devices/metrics") ||
    topic.includes("/devices/hwmon") ||
    topic.includes("meta") ||
    topic.includes("/devices/network") ||
    topic.includes("/devices/system") ||
    topic.includes("/on")
  );
};

export const booleanProperty = (topic: string, message: Buffer, targetTopic: string) => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  const pin = parseInt(topic.replace(targetTopic, ""));
  let value = false;

  if (message.toString() === TRUE) {
    value = true;
  }

  if (message.toString() === FALSE) {
    value = false;
  }

  if (!Number.isSafeInteger(pin) || (message.toString() !== TRUE && message.toString() !== FALSE)) {
    logger("Pin is not a integer, and value is nor '1' or '0' 🚨");
    logger(JSON.stringify({ topic, pin, message: message.toString() }, null, 2));

    return new Error("INVALID_MESSAGE");
  }

  return { topic, message: message.toString(), pin, value };
};

export const numberProperty = (topic: string, message: Buffer, targetTopic: string) => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  let pin = parseInt(topic.replace(targetTopic, ""));
  const value = parseInt(message.toString());

  if (Number.isNaN(pin)) {
    pin = 0;
  }

  if (!Number.isSafeInteger(value)) {
    logger("Pin or value is not a integer 🚨");
    logger(JSON.stringify({ topic, pin, message: message.toString() }, null, 2));

    return new Error("INVALID_MESSAGE");
  }

  return { topic, message: message.toString(), pin, value };
};

export const twoPinRelayProperty = (
  topic: string,
  message: Buffer,
  targetTopic: string,
): DirectionRelayProperty | Error => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  let value = false;

  if (message.toString() === TRUE) {
    value = true;
  }

  if (message.toString() === FALSE) {
    value = false;
  }

  const subTopic = topic.replace(targetTopic, "");

  if (subTopic.includes("ON")) {
    const pin = parseInt(subTopic.replace("ON", ""));

    return { topic, message: message.toString(), pin, value, type: "ON" };
  }

  if (subTopic.includes("DIR")) {
    const pin = parseInt(subTopic.replace("DIR", ""));

    return { topic, message: message.toString(), pin, value, type: "DIR" };
  }

  return new Error("UNEXPECTED_TYPE");
};

export const boilerProperty = (
  topic: string,
  message: Buffer,
  targetTopic: string,
): BoilerProperty | Error => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  const result: BoilerProperty = {
    topic,
    message: message.toString(),
    targetTopic,
    fwVersion: undefined,
    heatingSetpoint: undefined,
    hotWaterSetpoint: undefined,
    waterPressure: undefined,
    boilerStatus: undefined,
    errorCode: undefined,
    heatingTemperature: undefined,
    hotWaterTemperature: undefined,
  };

  const property = topic.replace(targetTopic, "");
  const value = message.toString();

  if (property === "FW Version") {
    result.fwVersion = parseFloat(value);
  }

  if (property === "Heating Setpoint") {
    result.heatingSetpoint = parseFloat(value);
  }

  if (property === "Hot Water Setpoint") {
    result.hotWaterSetpoint = parseFloat(value);
  }

  if (property === "Water Pressure") {
    result.waterPressure = parseFloat(value);
  }

  if (property === "Boiler Status") {
    result.boilerStatus = parseFloat(value);
  }

  if (property === "Error Code") {
    result.errorCode = parseFloat(value);
  }

  if (property === "Heating Temperature") {
    result.heatingTemperature = parseFloat(value);
  }

  if (property === "Hot Water Temperature") {
    result.hotWaterTemperature = parseFloat(value);
  }

  return result;
};

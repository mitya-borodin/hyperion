import debug from "debug";
import mqtt, { MqttClient } from "mqtt";

import { Config } from "../../config";

type RunWirenboard = {
  config: Config;
};

const logger = debug("wirenboard");

/**
 * https://wirenboard.com/ru/product/WBIO-DI-WD-14/
 */
const WBIO_1_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT1_IN";
const WBIO_2_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT2_IN";
const WBIO_3_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT3_IN";

/**
 * https://wirenboard.com/ru/product/WBIO-DI-HVD-8/
 */

const WBIO_4_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT4_IN";

/**
 * https://wirenboard.com/ru/product/WBIO-DO-SSR-8/
 */
const WBIO_5_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT5_K";
const WBIO_6_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT6_K";
const WBIO_7_GPIO_TOPIC = "/devices/wb-gpio/controls/EXT7_K";

/**
 * https://wirenboard.com/ru/product/WBIO-AO-10V-8/
 */
const WBIO_8_DAC_TOPIC = "/devices/wb-dac/controls/EXT8_O";

/**
 * https://wirenboard.com/ru/product/WB-MIO-E/
 * https://wirenboard.com/ru/product/WBIO-DO-R10R-4/
 * Топик может быть:
 * 1. /devices/wb-mio-gpio_52:1/controls/DIR1
 * 2. /devices/wb-mio-gpio_52:1/controls/ON1
 */
const WBIO_1_R10R_4_TOPIC = "/devices/wb-mio-gpio_52:1/controls/";
const WBIO_2_R10R_4_TOPIC = "/devices/wb-mio-gpio_52:2/controls/";
const WBIO_3_R10R_4_TOPIC = "/devices/wb-mio-gpio_52:3/controls/";
const WBIO_4_R10R_4_TOPIC = "/devices/wb-mio-gpio_52:4/controls/";

/**
 * https://wirenboard.com/ru/product/WB-MRPS6/
 */
const WB_MRPS6_21_TOPIC = "/devices/wb-mr6cu_21/controls/K";
const WB_MRPS6_33_TOPIC = "/devices/wb-mr6cu_33/controls/K";
const WB_MRPS6_37_TOPIC = "/devices/wb-mr6cu_37/controls/K";
const WB_MRPS6_49_TOPIC = "/devices/wb-mr6cu_49/controls/K";
const WB_MRPS6_50_TOPIC = "/devices/wb-mr6cu_50/controls/K";
const WB_MRPS6_69_TOPIC = "/devices/wb-mr6cu_69/controls/K";
const WB_MRPS6_77_TOPIC = "/devices/wb-mr6cu_77/controls/K";
const WB_MRPS6_81_TOPIC = "/devices/wb-mr6cu_81/controls/K";
const WB_MRPS6_85_TOPIC = "/devices/wb-mr6cu_85/controls/K";
const WB_MRPS6_97_TOPIC = "/devices/wb-mr6cu_97/controls/K";
const WB_MRPS6_117_TOPIC = "/devices/wb-mr6cu_117/controls/K";
const WB_MRPS6_16_TOPIC = "/devices/wb-mr6cu_16/controls/K";

/**
 * https://wirenboard.com/ru/product/wb-mrwl3/
 */
const WB_MRWL3_123_TOPIC = "/devices/wb-mr3_123/controls/K";

/**
 * https://wirenboard.com/ru/product/WBE2-I-OPENTHERM/
 */
const WBE2_I_OPENTHERM_TOPIC = "/devices/wbe2-i-opentherm_11/controls/";

/**
 * https://wirenboard.com/ru/product/WBE2-I-EBUS/
 */
const WBE2_I_EBUS_TOPIC = "/devices/wbe2-i-ebus_12/controls/";

const TRUE = "1";
const FALSE = "0";

export const runWirenboard = async ({ config }: RunWirenboard) => {
  logger("Try to establish connection with wirenboard ℹ️");
  logger(
    `Socket: ${config.mosquitto.protocol}://${config.mosquitto.host}:${config.mosquitto.port} ℹ️`,
  );

  const client = mqtt.connect({
    host: config.mosquitto.host,
    port: config.mosquitto.port,
    protocol: config.mosquitto.protocol,
    username: config.mosquitto.username,
    password: config.mosquitto.password,
  });

  await new Promise((resolve, reject) => {
    client.on("connect", function () {
      client.subscribe("/devices/#", (error) => {
        if (error) {
          logger("Unable to establish connection with wirenboard 🚨");
          logger(error.message);

          return reject();
        }

        logger("Connection to the wirenboard is established ✅");
        resolve(undefined);
      });
    });
  });

  client.on("error", (error) => {
    logger("An error occurred in the MQTT connection to the WB 🚨");
    logger(error.message);
  });

  client.on("message", (topic: string, message: Buffer) => {
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

    if (topic.includes(WB_MRPS6_21_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_21_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_21 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_33_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_33_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_33 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_37_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_37_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_37 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_49_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_49_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_49 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_50_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_50_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_50 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_69_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_69_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_69 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_77_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_77_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_77 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_81_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_81_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_81 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_85_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_85_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_85 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_97_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_97_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_97 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_117_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_117_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_117 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRPS6_16_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRPS6_16_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mr6cu_16 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }

    if (topic.includes(WB_MRWL3_123_TOPIC)) {
      const result = booleanProperty(topic, message, WB_MRWL3_123_TOPIC);

      if (result instanceof Error) {
        return;
      }

      logger("wb-mrwl_123 Message was parsed ✅");
      logger(JSON.stringify(result, null, 2));
    }
  });

  return {
    client,
    stopWirenboard: () => {
      client.unsubscribe("/devices/#");
      client.end();
    },
  };
};

export const publishWirenboardMessage = async (
  client: MqttClient,
  topic: string,
  message: Buffer,
): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    client.publish(topic, message, (error) => {
      if (error) {
        logger("An error occurred in the MQTT connection to the WB 🚨");
        logger(error.message);

        resolve(error);

        return;
      }

      resolve(undefined);
    });
  });
};

const isNeedToSkip = (topic: string) => {
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

const booleanProperty = (topic: string, message: Buffer, targetTopic: string) => {
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

const numberProperty = (topic: string, message: Buffer, targetTopic: string) => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  const pin = parseInt(topic.replace(targetTopic, ""));
  const value = parseInt(message.toString());

  if (!Number.isSafeInteger(pin) || !Number.isSafeInteger(value)) {
    logger("Pin or value is not a integer 🚨");
    logger(JSON.stringify({ topic, pin, message: message.toString() }, null, 2));

    return new Error("INVALID_MESSAGE");
  }

  return { topic, message: message.toString(), pin, value };
};

const directionRelayProperty = (topic: string, message: Buffer, targetTopic: string) => {
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
};

const boilerProperty = (topic: string, message: Buffer, targetTopic: string) => {
  if (isNeedToSkip(topic)) {
    return new Error("NEED_TO_SKIP_TOPIC");
  }

  const result: { [key: string]: string | number | undefined } = {
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

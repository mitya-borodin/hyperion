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

/**
 * https://wirenboard.com/ru/product/WB-M1W2/
 */

const WB_M1W2_30_TOPIC = "/devices/wb-m1w2_30/controls/External Sensor";
const WB_M1W2_41_TOPIC = "/devices/wb-m1w2_41/controls/External Sensor";
const WB_M1W2_56_TOPIC = "/devices/wb-m1w2_56/controls/External Sensor";
const WB_M1W2_69_TOPIC = "/devices/wb-m1w2_69/controls/External Sensor";
const WB_M1W2_91_TOPIC = "/devices/wb-m1w2_91/controls/External Sensor";
const WB_M1W2_97_TOPIC = "/devices/wb-m1w2_97/controls/External Sensor";
const WB_M1W2_153_TOPIC = "/devices/wb-m1w2_153/controls/External Sensor";
const WB_M1W2_168_TOPIC = "/devices/wb-m1w2_168/controls/External Sensor";
const WB_M1W2_170_TOPIC = "/devices/wb-m1w2_170/controls/External Sensor";
const WB_M1W2_171_TOPIC = "/devices/wb-m1w2_171/controls/External Sensor";
const WB_M1W2_172_TOPIC = "/devices/wb-m1w2_172/controls/External Sensor";
const WB_M1W2_173_TOPIC = "/devices/wb-m1w2_173/controls/External Sensor";
const WB_M1W2_174_TOPIC = "/devices/wb-m1w2_174/controls/External Sensor";
const WB_M1W2_210_TOPIC = "/devices/wb-m1w2_210/controls/External Sensor";

/**
 * https://wirenboard.com/wiki/Wiren_Board_6#Каналы_W1-W2
 */

const WB_W1_UP_TOPIC = "/devices/wb-w1/controls/28-00000d885de4";
const WB_W1_DOWN_TOPIC = "/devices/wb-w1/controls/28-00000d882feb";

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

      if (result.pin === 1) {
        logger(BUTLER_RELAY.RELAY_1);
      }

      if (result.pin === 2) {
        logger(BUTLER_RELAY.RELAY_2);
      }

      if (result.pin === 3) {
        logger(BUTLER_RELAY.RELAY_3);
      }

      if (result.pin === 4) {
        logger(BUTLER_RELAY.RELAY_4);
      }

      if (result.pin === 5) {
        logger(BUTLER_RELAY.RELAY_5);
      }

      if (result.pin === 6) {
        logger(BUTLER_RELAY.RELAY_6);
      }
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
  });

  return {
    client,
    stopWirenboard: () => {
      client.unsubscribe("/devices/#");
      client.end();
    },
  };
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

const publishWirenboardMessage = async (
  client: MqttClient,
  topic: string,
  message: Buffer,
): Promise<undefined | Error> => {
  return new Promise((resolve) => {
    client.publish(topic, message, (error) => {
      if (error) {
        logger("An error occurred when sending a message via MQTT WB 🚨");
        logger(error);

        resolve(error);

        return;
      }

      resolve(undefined);
    });
  });
};

export const switchRelays = async (
  client: MqttClient,
  relays: BUTLER_RELAY[],
  state: "1" | "0",
): Promise<undefined | Error> => {
  const results = await Promise.all(relays.map((relay) => switchRelay(client, relay, state)));

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error("FAILED_SWITCH_RELAYS");
  }

  return undefined;
};

const switchRelay = async (client: MqttClient, relay: BUTLER_RELAY, state: "1" | "0") => {
  if (relay === BUTLER_RELAY.RELAY_1) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_2) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_3) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_4) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_5) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_6) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_7) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_8) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_9) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_10) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_11) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_12) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_13) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_14) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_15) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_16) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_17) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_18) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_19) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_20) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_21) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_22) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_23) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_24) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_25) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_26) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_27) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_28) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_29) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_30) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_31) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_32) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_33) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_34) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_35) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_36) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_37) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_38) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_39) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_40) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_41) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_42) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_43) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_44) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_45) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_46) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_47) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_48) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_49) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_50) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_51) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_52) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_53) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_54) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_55) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_56) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_57) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_58) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_59) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_60) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_61) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_62) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_63) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_64) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_65) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_66) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_67) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_68) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_69) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_70) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_71) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_72) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_73) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_74) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === BUTLER_RELAY.RELAY_75) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }
};

export enum BUTLER_RELAY {
  /**
   * Освещение - Гостиная - Основной - Часть 1 ( SL1 ) - 1 - 1
   */
  RELAY_1 = "RELAY_1",
  /**
   * Освещение - Гостиная - Основной - Часть 2 ( SL2 ) - 1- 2
   */
  RELAY_2 = "RELAY_2",
  /**
   * Освещение - Гостиная - Основной - Часть 3 ( SL3 ) - 1 - 3
   */
  RELAY_3 = "RELAY_3",
  /**
   * Освещение - Гостиная - Основной - Часть 4 ( SL4 ) - 1 - 4
   */
  RELAY_4 = "RELAY_4",
  /**
   * Освещение - Гостиная - Основной - Часть 5 ( SL5 ) - 1 - 5
   */
  RELAY_5 = "RELAY_5",
  /**
   * Освещение - Гостиная - Основной - Часть 6 ( SL6 ) - 1 - 6
   */
  RELAY_6 = "RELAY_6",
  /**
   * Освещение - Гостиная - Основной - Часть 7 ( SL7 ) - 2 - 1
   */
  RELAY_7 = "RELAY_7",
  /**
   * Освещение - Игровая - Основной - Часть 1 ( SL8 ) - 2 - 2
   */
  RELAY_8 = "RELAY_8",
  /**
   * Освещение - Игровая - Основной - Часть 2 ( SL9 ) - 2 - 3
   */
  RELAY_9 = "RELAY_9",
  /**
   * Освещение - Игровая - Люстра ( SL10 ) - 2 - 4
   */
  RELAY_10 = "RELAY_10",
  /**
   * Освещение - Игровая - Тумбочки ( SL11 ) - 2 - 5
   */
  RELAY_11 = "RELAY_11",
  /**
   * Освещение - Игровая - Рабочий стол ( SL12 ) - 2 - 6
   */
  RELAY_12 = "RELAY_12",
  /**
   * Освещение - Ванная - Основной ( SL13 ) - 3 - 1
   */
  RELAY_13 = "RELAY_13",
  /**
   * Обогрев - Ванная - Зеркало ( SL14 ) - 3 - 2
   */
  RELAY_14 = "RELAY_14",
  /**
   * Освещение - Спальня - Основной ( SL15 ) - 3 - 3
   */
  RELAY_15 = "RELAY_15",
  /**
   * Освещение - Спальня - Тумбочки ( SL16 ) - 3 - 4
   */
  RELAY_16 = "RELAY_16",
  /**
   * Освещение - Прихожая - Основной - Часть 1 ( SL17 ) - 3 - 5
   */
  RELAY_17 = "RELAY_17",
  /**
   * Освещение - Прихожая - Основной - Часть 2 ( SL18 ) - 3 - 6
   */
  RELAY_18 = "RELAY_18",
  /**
   * Освещение - Коридор - Основной - Часть 2 ( SL19 ) - 4 - 1
   */
  RELAY_19 = "RELAY_19",
  /**
   * Освещение - Крыльцо ( SL20 ) - 4 - 2
   */
  RELAY_20 = "RELAY_20",
  /**
   * Освещение - Хозяйственная - Основной ( SL21 ) - 4 - 3
   */
  RELAY_21 = "RELAY_21",
  /**
   * Освещение - Кабинет - Основной - Часть 1 ( SL22 ) - 4 - 4
   */
  RELAY_22 = "RELAY_22",
  /**
   * Освещение - Кабинет - Основной - Часть 2 ( SL23 ) - 4 - 5
   */
  RELAY_23 = "RELAY_23",
  /**
   * Освещение - Кабинет - Рабочий стол 1 ( SL24 ) - 4 - 6
   */
  RELAY_24 = "RELAY_24",
  /**
   * Освещение - Кабинет - Рабочий стол 2 ( SL25 ) - 5 - 1
   */
  RELAY_25 = "RELAY_25",
  /**
   * Освещение - Инженерная ( SL26 ) - 5 - 2
   */
  RELAY_26 = "RELAY_26",
  /**
   * Освещение - Крыша ( SL27 ) - 5 - 3
   */
  RELAY_27 = "RELAY_27",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL28 ) - 5 - 4
   */
  RELAY_28 = "RELAY_28",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL29 ) - 5 - 5
   */
  RELAY_29 = "RELAY_29",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL30 ) - 5 - 6
   */
  RELAY_30 = "RELAY_30",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL31 ) - 6 - 1
   */
  RELAY_31 = "RELAY_31",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL32 ) - 6 - 2
   */
  RELAY_32 = "RELAY_32",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL33 ) - 6 - 3
   */
  RELAY_33 = "RELAY_33",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL34 ) - 6 - 4
   */
  RELAY_34 = "RELAY_34",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL35 ) - 6 - 5
   */
  RELAY_35 = "RELAY_35",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL36 ) - 6 - 6
   */
  RELAY_36 = "RELAY_36",
  /**
   * Освещение - Feron.PRO LL-1000 50W 41542 ( SL37 ) - 7 - 1
   */
  RELAY_37 = "RELAY_37",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL38 ) - 7 - 2
   */
  RELAY_38 = "RELAY_38",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL39 ) - 7 - 3
   */
  RELAY_39 = "RELAY_39",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL40 ) - 7 - 4
   */
  RELAY_40 = "RELAY_40",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL41 ) - 7 - 5
   */
  RELAY_41 = "RELAY_41",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL42 ) - 7 - 6
   */
  RELAY_42 = "RELAY_42",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL43 ) - 8 - 1
   */
  RELAY_43 = "RELAY_43",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL44 ) - 8 - 2
   */
  RELAY_44 = "RELAY_44",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL45 ) - 8 - 3
   */
  RELAY_45 = "RELAY_45",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL46 ) - 8 - 4
   */
  RELAY_46 = "RELAY_46",
  /**
   * Освещение фасада - 6м - 8 Вт/м - 48 Вт ( SL47 ) - 8 - 5
   */
  RELAY_47 = "RELAY_47",
  /**
   * Отопление - Насос Кольца ( SL48 ) - 8 - 6
   */
  RELAY_48 = "RELAY_48",
  /**
   * Отопление - Насос Теплого пола ( SL49 ) - 9 - 1
   */
  RELAY_49 = "RELAY_49",
  /**
   * Отопление - Насос радиаторной сети ( SL50 ) - 9 - 2
   */
  RELAY_50 = "RELAY_50",
  /**
   * Обогрев водостока - греющий кабель - слева MAX 20метров  ( SL51 ) - 9 - 3
   */
  RELAY_51 = "RELAY_51",
  /**
   * Обогрев водостока - греющий кабель - слева MAX 20метров  ( SL52 ) - 9 - 4
   */
  RELAY_52 = "RELAY_52",
  /**
   * Обогрев водостока - греющий кабель - слева MAX 20метров  ( SL53 ) - 9 - 5
   */
  RELAY_53 = "RELAY_53",
  /**
   * Увлажнение - Розетка - Гостиная ( SL26 -> SL54 ) - 9 - 6
   */
  RELAY_54 = "RELAY_54",
  /**
   * Увлажнение - Розетка - Игровая  ( SL27 -> SL55 ) - 10 - 1
   */
  RELAY_55 = "RELAY_55",
  /**
   * Увлажнение - Розетка - Спальня ( SL28 -> SL56 ) - 10 - 2
   */
  RELAY_56 = "RELAY_56",
  /**
   * Увлажнение - Розетка - Кабинет ( SL29 -> SL57 ) - 10 - 3
   */
  RELAY_57 = "RELAY_57",
  /**
   * Генератор - Управляющий кабель генератора ( SL58 ) - 10 - 4
   */
  RELAY_58 = "RELAY_58",
  /**
   * Блок питания ИК подсветки ( SL59 ) - 10 - 5
   */
  RELAY_59 = "RELAY_59",
  /**
   * Блок питания ИК подсветки ( SL60 ) - 10 - 6
   */
  RELAY_60 = "RELAY_60",
  /**
   * Привод вентиляционной заслонки - Приточка ( SL61 ) - 11 - 1
   */
  RELAY_61 = "RELAY_61",
  /**
   * Привод вентиляционной заслонки - Вытяжка ( SL62 ) - 11 - 2
   */
  RELAY_62 = "RELAY_62",
  /**
   * Привод вентиляционной заслонки - Кухня - Вытяжка ( SL63 ) - 11 - 3
   */
  RELAY_63 = "RELAY_63",
  /**
   * Привод вентиляционной заслонки - Гостиная ( SL64 ) - 11 - 4
   */
  RELAY_64 = "RELAY_64",
  /**
   * Привод вентиляционной заслонки - Игровая ( SL65 ) - 11 - 5
   */
  RELAY_65 = "RELAY_65",
  /**
   * Привод вентиляционной заслонки - Ванная ( SL66 ) - 11 - 6
   */
  RELAY_66 = "RELAY_66",
  /**
   * Привод вентиляционной заслонки - Спальня ( SL67 ) - 12 - 1
   */
  RELAY_67 = "RELAY_67",
  /**
   * Привод вентиляционной заслонки - Кабинет ( SL68 ) - 12 - 2
   */
  RELAY_68 = "RELAY_68",
  /**
   * Привод вентиляционной заслонки - Хозяйственная ( SL69 ) - 12 - 3
   */
  RELAY_69 = "RELAY_69",
  /**
   * Привод вентиляционной заслонки - Стояк канализации ( SL70 ) - 12 - 4
   */
  RELAY_70 = "RELAY_70",
  /**
   * Отопление - Насос циркуляции ГВС ( SL71 ) - 12 - 5
   */
  RELAY_71 = "RELAY_71",
  /**
   * Отопление - Насос загрузки бойлера ( SL72 ) - 12 - 6
   */
  RELAY_72 = "RELAY_72",
  /**
   * Отопление - Насос вентиляции ( SL73 ) - 1 - 1
   */
  RELAY_73 = "RELAY_73",
  /**
   * Термостат газового котла ( SL74 ) - 1 - 2
   */
  RELAY_74 = "RELAY_74",
  /**
   * Термостат электрического котла ( SL75 ) - 1 - 3
   */
  RELAY_75 = "RELAY_75",
}

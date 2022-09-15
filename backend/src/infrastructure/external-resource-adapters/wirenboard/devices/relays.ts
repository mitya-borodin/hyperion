import EventEmitter from "events";

import debug from "debug";
import { MqttClient } from "mqtt";

import { booleanProperty } from "../on-message-utils";
import { publishWirenboardMessage } from "../publish-message";
import {
  WB_MRPS6_21_TOPIC,
  WB_MRPS6_33_TOPIC,
  WB_MRPS6_37_TOPIC,
  WB_MRPS6_49_TOPIC,
  WB_MRPS6_50_TOPIC,
  WB_MRPS6_69_TOPIC,
  WB_MRPS6_77_TOPIC,
  WB_MRPS6_81_TOPIC,
  WB_MRPS6_85_TOPIC,
  WB_MRPS6_97_TOPIC,
  WB_MRPS6_117_TOPIC,
  WB_MRPS6_16_TOPIC,
  WB_MRWL3_123_TOPIC,
} from "../topics";

const logger = debug("wirenboard:relay");

export enum COMMON_RELAY_NAME {
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

export const onRelayMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WB_MRPS6_21_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_21_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_21 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin}`, result.value);
  }

  if (topic.includes(WB_MRPS6_33_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_33_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_33 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 6}`, result.value);
  }

  if (topic.includes(WB_MRPS6_37_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_37_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_37 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 12}`, result.value);
  }

  if (topic.includes(WB_MRPS6_49_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_49_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_49 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 18}`, result.value);
  }

  if (topic.includes(WB_MRPS6_50_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_50_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_50 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 24}`, result.value);
  }

  if (topic.includes(WB_MRPS6_69_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_69_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_69 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 30}`, result.value);
  }

  if (topic.includes(WB_MRPS6_77_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_77_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_77 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 36}`, result.value);
  }

  if (topic.includes(WB_MRPS6_81_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_81_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_81 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 42}`, result.value);
  }

  if (topic.includes(WB_MRPS6_85_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_85_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_85 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 48}`, result.value);
  }

  if (topic.includes(WB_MRPS6_97_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_97_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_97 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 54}`, result.value);
  }

  if (topic.includes(WB_MRPS6_117_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_117_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_117 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 60}`, result.value);
  }

  if (topic.includes(WB_MRPS6_16_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_16_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mr6cu_16 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 66}`, result.value);
  }

  if (topic.includes(WB_MRWL3_123_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRWL3_123_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger("wb-mrwl_123 Message was parsed ✅");
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 72}`, result.value);
  }
};

export const switchRelays = async (
  client: MqttClient,
  relays: COMMON_RELAY_NAME[],
  state: "1" | "0",
): Promise<undefined | Error> => {
  const results = await Promise.all(relays.map((relay) => switchRelay(client, relay, state)));

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error("FAILED_SWITCH_RELAYS");
  }

  return undefined;
};

const switchRelay = async (client: MqttClient, relay: COMMON_RELAY_NAME, state: "1" | "0") => {
  if (relay === COMMON_RELAY_NAME.RELAY_1) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_2) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_3) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_4) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_5) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_6) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_21_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_7) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_8) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_9) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_10) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_11) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_12) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_33_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_13) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_14) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_15) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_16) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_17) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_18) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_37_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_19) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_20) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_21) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_22) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_23) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_24) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_49_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_25) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_26) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_27) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_28) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_29) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_30) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_50_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_31) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_32) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_33) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_34) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_35) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_36) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_69_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_37) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_38) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_39) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_40) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_41) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_42) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_77_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_43) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_44) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_45) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_46) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_47) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_48) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_81_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_49) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_50) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_51) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_52) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_53) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_54) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_85_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_55) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_56) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_57) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_58) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_59) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_60) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_97_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_61) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_62) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_63) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_64) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_65) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_66) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_117_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_67) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_68) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_69) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_70) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "4" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_71) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "5" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_72) {
    return await publishWirenboardMessage(
      client,
      WB_MRPS6_16_TOPIC + "6" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_73) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "1" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_74) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "2" + "/on",
      Buffer.from(state, "utf8"),
    );
  }

  if (relay === COMMON_RELAY_NAME.RELAY_75) {
    return await publishWirenboardMessage(
      client,
      WB_MRWL3_123_TOPIC + "3" + "/on",
      Buffer.from(state, "utf8"),
    );
  }
};

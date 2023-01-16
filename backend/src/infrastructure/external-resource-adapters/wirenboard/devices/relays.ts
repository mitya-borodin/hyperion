import EventEmitter from 'node:events';

import debug from 'debug';
import { MqttClient } from 'mqtt';

import { COMMON_RELAY_NAME } from '../../../../domain/wirenboard/relays';
import { booleanProperty } from '../on-message-utils';
import { publishWirenboardMessage } from '../publish-message';
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
} from '../topics';

const logger = debug('wirenboard:relay');

export const onRelayMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WB_MRPS6_21_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_21_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_21 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin}`, result.value);
  }

  if (topic.includes(WB_MRPS6_33_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_33_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_33 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 6}`, result.value);
  }

  if (topic.includes(WB_MRPS6_37_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_37_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_37 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 12}`, result.value);
  }

  if (topic.includes(WB_MRPS6_49_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_49_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_49 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 18}`, result.value);
  }

  if (topic.includes(WB_MRPS6_50_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_50_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_50 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 24}`, result.value);
  }

  if (topic.includes(WB_MRPS6_69_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_69_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_69 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 30}`, result.value);
  }

  if (topic.includes(WB_MRPS6_77_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_77_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_77 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 36}`, result.value);
  }

  if (topic.includes(WB_MRPS6_81_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_81_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_81 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 42}`, result.value);
  }

  if (topic.includes(WB_MRPS6_85_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_85_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_85 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 48}`, result.value);
  }

  if (topic.includes(WB_MRPS6_97_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_97_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_97 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 54}`, result.value);
  }

  if (topic.includes(WB_MRPS6_117_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_117_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_117 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 60}`, result.value);
  }

  if (topic.includes(WB_MRPS6_16_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRPS6_16_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mr6cu_16 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 66}`, result.value);
  }

  if (topic.includes(WB_MRWL3_123_TOPIC)) {
    const result = booleanProperty(topic, message, WB_MRWL3_123_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('wb-mrwl_123 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`RELAY_${result.pin + 72}`, result.value);
  }
};

export const switchRelays = async (
  client: MqttClient,
  relays: COMMON_RELAY_NAME[],
  state: '1' | '0',
): Promise<undefined | Error> => {
  const results = await Promise.all(relays.map((relay) => switchRelay(client, relay, state)));

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error('FAILED_SWITCH_RELAYS');
  }

  return undefined;
};

const switchRelay = async (client: MqttClient, relay: COMMON_RELAY_NAME, state: '1' | '0') => {
  if (relay === COMMON_RELAY_NAME.RELAY_1) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_2) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_3) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_4) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_5) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_6) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_21_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_7) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_8) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_9) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_10) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_11) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_12) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_33_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_13) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_14) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_15) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_16) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_17) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_18) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_37_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_19) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_20) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_21) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_22) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_23) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_24) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_49_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_25) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_26) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_27) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_28) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_29) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_30) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_50_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_31) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_32) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_33) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_34) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_35) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_36) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_69_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_37) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_38) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_39) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_40) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_41) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_42) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_77_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_43) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_44) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_45) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_46) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_47) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_48) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_81_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_49) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_50) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_51) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_52) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_53) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_54) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_85_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_55) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_56) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_57) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_58) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_59) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_60) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_97_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_61) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_62) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_63) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_64) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_65) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_66) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_117_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_67) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_68) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_69) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_70) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_71) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}5` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_72) {
    return await publishWirenboardMessage(client, `${WB_MRPS6_16_TOPIC}6` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_73) {
    return await publishWirenboardMessage(client, `${WB_MRWL3_123_TOPIC}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_74) {
    return await publishWirenboardMessage(client, `${WB_MRWL3_123_TOPIC}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === COMMON_RELAY_NAME.RELAY_75) {
    return await publishWirenboardMessage(client, `${WB_MRWL3_123_TOPIC}3` + '/on', Buffer.from(state, 'utf8'));
  }
};

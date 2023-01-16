/* eslint-disable unicorn/no-null */
import EventEmitter from 'node:events';

import debug from 'debug';
import { MqttClient } from 'mqtt';

import { TWO_PIN_REPLAY } from '../../../../domain/wirenboard/two-pin-relay';
import { twoPinRelayProperty } from '../on-message-utils';
import { publishWirenboardMessage } from '../publish-message';
import { WBIO_1_R10R_4_TOPIC, WBIO_2_R10R_4_TOPIC, WBIO_3_R10R_4_TOPIC, WBIO_4_R10R_4_TOPIC } from '../topics';

const logger = debug('wirenboard:on:two-pin-relay');

export const onTwoPinRelayMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBIO_1_R10R_4_TOPIC)) {
    const result = twoPinRelayProperty(topic, message, WBIO_1_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-R10R-4 wb-mio-gpio_52:1 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`TWO_PIN_REPLAY_${result.pin}`, {
      type: result.type,
      value: result.value,
    });
  }

  if (topic.includes(WBIO_2_R10R_4_TOPIC)) {
    const result = twoPinRelayProperty(topic, message, WBIO_2_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-R10R-4 wb-mio-gpio_52:2 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`TWO_PIN_REPLAY_${result.pin + 4}`, {
      type: result.type,
      value: result.value,
    });
  }

  if (topic.includes(WBIO_3_R10R_4_TOPIC)) {
    const result = twoPinRelayProperty(topic, message, WBIO_3_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-R10R-4 wb-mio-gpio_52:3 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`TWO_PIN_REPLAY_${result.pin + 8}`, {
      type: result.type,
      value: result.value,
    });
  }

  if (topic.includes(WBIO_4_R10R_4_TOPIC)) {
    const result = twoPinRelayProperty(topic, message, WBIO_4_R10R_4_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-R10R-4 wb-mio-gpio_52:4 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`TWO_PIN_REPLAY_${result.pin + 12}`, {
      type: result.type,
      value: result.value,
    });
  }
};

export const switchTwoPinRelayProperties = async (
  client: MqttClient,
  relays: TWO_PIN_REPLAY[],
  type: 'ON' | 'DIR',
  state: '1' | '0',
): Promise<undefined | Error> => {
  const results = await Promise.all(relays.map((relay) => switchTwoPinRelay(client, relay, type, state)));

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error('FAILED_SWITCH_RELAYS');
  }

  return undefined;
};

const switchTwoPinRelay = async (client: MqttClient, relay: TWO_PIN_REPLAY, type: 'ON' | 'DIR', state: '1' | '0') => {
  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_1) {
    return await publishWirenboardMessage(client, `${WBIO_1_R10R_4_TOPIC + type}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_2) {
    return await publishWirenboardMessage(client, `${WBIO_1_R10R_4_TOPIC + type}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_3) {
    return await publishWirenboardMessage(client, `${WBIO_1_R10R_4_TOPIC + type}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_4) {
    return await publishWirenboardMessage(client, `${WBIO_1_R10R_4_TOPIC + type}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_5) {
    return await publishWirenboardMessage(client, `${WBIO_2_R10R_4_TOPIC + type}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_6) {
    return await publishWirenboardMessage(client, `${WBIO_2_R10R_4_TOPIC + type}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_7) {
    return await publishWirenboardMessage(client, `${WBIO_2_R10R_4_TOPIC + type}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_8) {
    return await publishWirenboardMessage(client, `${WBIO_2_R10R_4_TOPIC + type}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_9) {
    return await publishWirenboardMessage(client, `${WBIO_3_R10R_4_TOPIC + type}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_10) {
    return await publishWirenboardMessage(client, `${WBIO_3_R10R_4_TOPIC + type}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_11) {
    return await publishWirenboardMessage(client, `${WBIO_3_R10R_4_TOPIC + type}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_12) {
    return await publishWirenboardMessage(client, `${WBIO_3_R10R_4_TOPIC + type}4` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_13) {
    return await publishWirenboardMessage(client, `${WBIO_4_R10R_4_TOPIC + type}1` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_14) {
    return await publishWirenboardMessage(client, `${WBIO_4_R10R_4_TOPIC + type}2` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_15) {
    return await publishWirenboardMessage(client, `${WBIO_4_R10R_4_TOPIC + type}3` + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === TWO_PIN_REPLAY.TWO_PIN_REPLAY_16) {
    return await publishWirenboardMessage(client, `${WBIO_4_R10R_4_TOPIC + type}4` + '/on', Buffer.from(state, 'utf8'));
  }
};

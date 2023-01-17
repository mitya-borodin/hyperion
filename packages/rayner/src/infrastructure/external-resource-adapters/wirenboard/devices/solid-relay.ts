/* eslint-disable unicorn/no-null */
/* eslint-disable prefer-template */
import EventEmitter from 'node:events';

import debug from 'debug';
import { MqttClient } from 'mqtt';

import { SOLID_RELAY } from '../../../../domain/wirenboard/solid-relay';
import { booleanProperty } from '../on-message-utils';
import { publishWirenboardMessage } from '../publish-message';
import { WBIO_5_GPIO_TOPIC, WBIO_6_GPIO_TOPIC, WBIO_7_GPIO_TOPIC } from '../topics';

const logger = debug('wirenboard:solid-relay');

export const onSolidRelayMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBIO_5_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_5_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-SSR-8 EXT5_K Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`SOLID_RELAY_${result.pin}`, result.value);
  }

  if (topic.includes(WBIO_6_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_6_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-SSR-8 EXT6_K Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`SOLID_RELAY_${result.pin + 8}`, result.value);
  }

  if (topic.includes(WBIO_7_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_7_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DO-SSR-8 EXT7_K Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`SOLID_RELAY_${result.pin + 16}`, result.value);
  }
};

export const switchSolidRelays = async (
  client: MqttClient,
  relays: SOLID_RELAY[],
  state: '1' | '0',
): Promise<undefined | Error> => {
  const results = await Promise.all(relays.map((relay) => switchSolidRelay(client, relay, state)));

  const hasError = results.some((result) => result instanceof Error);

  if (hasError) {
    return new Error('FAILED_SWITCH_RELAYS');
  }

  return undefined;
};

const switchSolidRelay = async (client: MqttClient, relay: SOLID_RELAY, state: '1' | '0') => {
  if (relay === SOLID_RELAY.SOLID_RELAY_1) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '1' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_2) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '2' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_3) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '3' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_4) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '4' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_5) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '5' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_6) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '6' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_7) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '7' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_8) {
    return await publishWirenboardMessage(client, WBIO_5_GPIO_TOPIC + '8' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_9) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '1' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_10) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '2' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_11) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '3' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_12) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '4' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_13) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '5' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_14) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '6' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_15) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '7' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_16) {
    return await publishWirenboardMessage(client, WBIO_6_GPIO_TOPIC + '8' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_17) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '1' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_18) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '2' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_19) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '3' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_20) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '4' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_21) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '5' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_22) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '6' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_23) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '7' + '/on', Buffer.from(state, 'utf8'));
  }

  if (relay === SOLID_RELAY.SOLID_RELAY_24) {
    return await publishWirenboardMessage(client, WBIO_7_GPIO_TOPIC + '8' + '/on', Buffer.from(state, 'utf8'));
  }
};

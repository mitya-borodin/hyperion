import EventEmitter from 'node:events';

import debug from 'debug';
import { MqttClient } from 'mqtt';

import { BOILER } from '../../../../domain/wirenboard/boiler';
import { boilerProperty } from '../on-message-utils';
import { publishWirenboardMessage } from '../publish-message';
import { WBE2_I_EBUS_GAS_TOPIC, WBE2_I_EBUS_ELECTRO_TOPIC } from '../topics';

const logger = debug('wirenboard:boiler');

export const onBoilerMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBE2_I_EBUS_GAS_TOPIC)) {
    const result = boilerProperty(topic, message, WBE2_I_EBUS_GAS_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBE2-I-EBUS_11 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(BOILER.GAS, result);
  }

  if (topic.includes(WBE2_I_EBUS_ELECTRO_TOPIC)) {
    const result = boilerProperty(topic, message, WBE2_I_EBUS_ELECTRO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBE2-I-EBUS_12 Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(BOILER.ELECTRO, result);
  }
};

export const setHeatingSetpoint = async (client: MqttClient, boiler: BOILER, heatingSetpoint: number) => {
  if (boiler === BOILER.GAS) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Добавить правильный путь для обновления heatingSetpoint
       */
      WBE2_I_EBUS_GAS_TOPIC,
      Buffer.from(String(heatingSetpoint), 'utf8'),
    );
  }

  if (boiler === BOILER.ELECTRO) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Добавить правильный путь для обновления heatingSetpoint
       */
      WBE2_I_EBUS_ELECTRO_TOPIC,
      Buffer.from(String(heatingSetpoint), 'utf8'),
    );
  }
};

export const setHotWaterSetpoint = async (client: MqttClient, boiler: BOILER, hotWaterSetpoint: number) => {
  if (boiler === BOILER.GAS) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Добавить правильный путь для обновления hotWaterSetpoint
       */
      WBE2_I_EBUS_GAS_TOPIC,
      Buffer.from(String(hotWaterSetpoint), 'utf8'),
    );
  }

  if (boiler === BOILER.ELECTRO) {
    return await publishWirenboardMessage(
      client,
      /**
       * ? Добавить правильный путь для обновления hotWaterSetpoint
       */
      WBE2_I_EBUS_ELECTRO_TOPIC,
      Buffer.from(String(hotWaterSetpoint), 'utf8'),
    );
  }
};

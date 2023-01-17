import EventEmitter from 'node:events';

import debug from 'debug';

import { booleanProperty } from '../on-message-utils';
import { WBIO_4_GPIO_TOPIC } from '../topics';

const logger = debug('wirenboard:ac-detector');

/**
 * Детектор переменного напряжения позволяет определять наличие 220В на линии.
 */
export const onAcDetectorMessage = (eventemitter: EventEmitter, topic: string, message: Buffer) => {
  if (topic.includes(WBIO_4_GPIO_TOPIC)) {
    const result = booleanProperty(topic, message, WBIO_4_GPIO_TOPIC);

    if (result instanceof Error) {
      return;
    }

    logger('WBIO-DI-HVD-8 EXT4_IN Message was parsed ✅');
    logger(JSON.stringify(result, null, 2));

    eventemitter.emit(`AC_DETECTOR_${result.pin}`, result.value);
  }
};

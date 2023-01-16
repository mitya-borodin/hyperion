import debug from 'debug';
import execa from 'execa';

const logger = debug('BUTLER-WB-IFUP');

export const ifup = async () => {
  try {
    logger('Try lunch `ifup usb0` ℹ️');

    const { stdout, stderr } = await execa('ifup', ['usb0']);

    logger('The ifup was successful lunched ✅');
    logger(stdout);
    logger(stderr);
  } catch (error) {
    logger('Ifup failed 🚨');

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error('IFUP_FAILED');
  }
};

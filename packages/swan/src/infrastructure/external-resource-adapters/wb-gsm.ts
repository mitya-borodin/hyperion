/* eslint-disable no-constant-condition */
import { exec } from 'node:child_process';

import { delay } from 'abort-controller-x';
import debug from 'debug';

import { DELAY_MS } from '../..';

const logger = debug('BUTLER-WB-GSM');

type WbGsmParameters = {
  signal: AbortSignal;
};

export const wbGsm = async ({ signal }: WbGsmParameters) => {
  logger('Before try to first lunch `wb-gsm restart_if_broken` need to wait 1 minute ℹ️');

  await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));

  try {
    while (true) {
      logger('Try to lunch `wb-gsm restart_if_broken` ℹ️');

      const command = 'DEBUG=true wb-gsm restart_if_broken';

      const childProcess = exec(command, { signal }, (error, stdout, stderr) => {
        if (error) {
          logger(command);
          logger(error.message);

          return;
        }

        logger(command);
        logger(stdout);
        logger(stderr);
      });

      childProcess.on('error', (error) => {
        logger(error.message);
      });

      childProcess.once('close', (code) => {
        logger('The wb-gsm restart_if_broken process was closed');
        logger(JSON.stringify({ code }, null, 2));
      });

      const timer = setTimeout(() => {
        logger(
          'The wb-gsm restart_if_broken process does not finish for more than 30 seconds,' +
            ' the process will be forcibly stopped and restarted 🚨',
        );

        childProcess.kill();
      }, 30 * 1000);

      const isExit = await new Promise((resolve) => {
        childProcess.once('exit', (code) => {
          logger(`wb-gsm restart_if_broken process exited with code ${code}`);

          if (code === 0) {
            clearTimeout(timer);
            resolve(true);
          } else {
            logger('The GSM launch failed 🚨');

            resolve(false);
          }
        });
      });

      if (isExit) {
        logger('The GSM was successful lunched ✅');

        return;
      }

      await delay(signal, DELAY_MS);
    }
  } catch (error: unknown) {
    logger('The GSM launch failed 🚨');

    if (error instanceof Error) {
      logger(error.message);
    }

    return new Error('WB_GSM_FAILED');
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';

import fetch from 'node-fetch';
import { Logger } from 'pino';
import { stringify } from 'qs';

import { ErrorType } from '../../helpers/error-type';
import { Config } from '../config';

export type VerifyGeetestCaptchaParameters = {
  config: Config;
  logger: Logger;
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
};

export const verifyGeetestCaptcha = async ({
  config,
  logger,
  lot_number,
  captcha_output,
  pass_token,
  gen_time,
}: VerifyGeetestCaptchaParameters): Promise<boolean | Error> => {
  const sign_token = makeSignToken(lot_number, config.geetest.captchaKey);

  const query = {
    captcha_output,
    pass_token,
    gen_time,
    lot_number,
    captcha_id: config.geetest.captchaId,
    sign_token,
  };

  const querystring = stringify(query);

  try {
    const response = await fetch(`${config.geetest.apiUrl}?${querystring}`, { method: 'get' });

    if (!response.ok) {
      logger.error(
        {
          geetestConfig: config.geetest,
          query,
          querystring,
          method: 'get',
          status: response.status,
          statusText: response.statusText,
        },
        'Failed to verify a geetest captcha 🚨',
      );

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }

    const result: any = await response.json();

    if (result.result === 'success') {
      return true;
    }

    if (result.result === 'fail') {
      return false;
    }

    return false;
  } catch (error) {
    logger.error(
      {
        geetestConfig: config.geetest,
        query,
        querystring,
        err: error,
      },
      'The attempt to check geetest captcha failed 🚨',
    );

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }
};

const makeSignToken = (lot_number: string, captchaKey: string): string => {
  return crypto.createHmac('sha256', captchaKey).update(lot_number, 'utf8').digest('hex');
};

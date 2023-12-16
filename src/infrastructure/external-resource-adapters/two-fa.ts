/* eslint-disable import/no-named-as-default-member */
import debug from 'debug';
import * as speakeasy from 'speakeasy';
import { GeneratedSecret } from 'speakeasy';

import { ErrorType } from '../../helpers/error-type';

const logger = debug('hyperion-two-fa');

export const createTwoFa = (): GeneratedSecret | Error => {
  try {
    return speakeasy.generateSecret({ length: 20, name: 'eb285490-80b3-4d3a-b597-b89e096fd612' });
  } catch (error) {
    logger('An attempt to create Two Fa failed 🚨');
    logger(JSON.stringify({ error }, null, 2));

    return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
  }
};

type VerifyTwoFa = {
  secret: string;
  totp: string;
};

export const verifyTwoFa = ({ secret, totp }: VerifyTwoFa): boolean | Error => {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'hex',
      token: totp,
      window: 1,
    });
  } catch (error) {
    logger('An attempt to verify Two Fa failed 🚨');
    logger(JSON.stringify({ secret, totp, error }, null, 2));

    return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
  }
};

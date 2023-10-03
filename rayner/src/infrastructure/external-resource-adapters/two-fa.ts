/* eslint-disable import/no-named-as-default-member */
import { Logger } from 'pino';
import * as speakeasy from 'speakeasy';
import { GeneratedSecret } from 'speakeasy';

import { ErrorType } from '../../helpers/error-type';

type CreateTwoFa = {
  logger: Logger;
};

export const createTwoFa = ({ logger }: CreateTwoFa): GeneratedSecret | Error => {
  try {
    return speakeasy.generateSecret({ length: 20, name: 'eb285490-80b3-4d3a-b597-b89e096fd612' });
  } catch (error) {
    logger.error({ err: error }, 'An attempt to create Two Fa failed 🚨');

    return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
  }
};

type VerifyTwoFa = {
  logger: Logger;
  secret: string;
  totp: string;
};

export const verifyTwoFa = ({ logger, secret, totp }: VerifyTwoFa): boolean | Error => {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'hex',
      token: totp,
      window: 1,
    });
  } catch (error) {
    logger.error({ secret, totp, err: error }, 'An attempt to verify Two Fa failed 🚨');

    return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
  }
};

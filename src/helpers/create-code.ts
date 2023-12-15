import { addDays, addHours } from 'date-fns';
import debug from 'debug';
import { v4 } from 'uuid';

import { ErrorType } from './error-type';

const logger = debug('create-code');

export enum CodeType {
  EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
  NEXT_EMAIL_CONFIRMATION = 'NEXT_EMAIL_CONFIRMATION',
}

export const createCode = (codeType: CodeType) => {
  const value = v4();
  let expiresIn: Date;

  switch (codeType) {
    case CodeType.EMAIL_CONFIRMATION: {
      expiresIn = addDays(new Date(), 7);

      break;
    }
    case CodeType.REFRESH_TOKEN: {
      expiresIn = addDays(new Date(), 30);

      break;
    }
    case CodeType.PASSWORD_RECOVERY: {
      expiresIn = addHours(new Date(), 1);

      break;
    }
    case CodeType.NEXT_EMAIL_CONFIRMATION: {
      expiresIn = addHours(new Date(), 1);

      break;
    }
    default: {
      logger('Failed to create expiresIn, case was not found 🚨');

      return new Error(ErrorType.INVALID_ARGUMENTS);
    }
  }

  return { value, expiresIn };
};

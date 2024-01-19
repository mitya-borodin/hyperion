import debug from 'debug';

import { UserRole, UserStatus } from '../../domain/user';
import { CaptchaParameters } from '../../helpers/captcha-parameters-type';
import { comparePasswords } from '../../helpers/compare-passwords';
import { ErrorExplanation } from '../../helpers/custom-error';
import { ErrorCode, ErrorMessage, ErrorType } from '../../helpers/error-type';
import { Config } from '../../infrastructure/config';
import { verifyGeetestCaptcha } from '../../infrastructure/external-resource-adapters/geetest';
import { IUserRepository, UserOutput } from '../../ports/user-repository';

const logger = debug('hyperion-sign-in');

export type SignIn = {
  config: Config;
  email: string;
  password: string;
  captcha: CaptchaParameters;
  userRepository: IUserRepository;
};

export const signIn = async ({
  config,
  userRepository,
  captcha,
  email,
  password,
}: SignIn): Promise<Error | { user?: UserOutput; error: ErrorExplanation }> => {
  const isCaptchaValid = await verifyGeetestCaptcha({
    config,
    ...captcha,
  });

  if (isCaptchaValid instanceof Error) {
    return isCaptchaValid;
  }

  if (!isCaptchaValid) {
    logger('Captcha invalid 🚨');
    logger(JSON.stringify({ email, captcha }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const user = await userRepository.getByEmail(email);

  if (user instanceof Error) {
    return user;
  }

  if (!user) {
    logger('The user with this email does not exists 🚨');
    logger(JSON.stringify({ email }, null, 2));

    return {
      user: undefined,
      error: {
        code: ErrorCode.PASSWORD_OR_EMAIL_INCORRECT,
        message: ErrorMessage.PASSWORD_OR_EMAIL_INCORRECT,
      },
    };
  }

  if (user.status !== UserStatus.ACTIVE) {
    logger('The user with this email is not ACTIVE 🚨');
    logger(JSON.stringify({ email, user }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERATOR && user.role !== UserRole.VIEWER) {
    logger('Invalid user role 🚨');
    logger(JSON.stringify({ user }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  if (!user.hash || !user.salt) {
    logger('User does not have password 🚨');
    logger(JSON.stringify({ user }, null, 2));

    return new Error(ErrorType.INVALID_ARGUMENTS);
  }

  const isPasswordValid = comparePasswords({
    config,
    password,
    originalPasswordHash: user.hash,
    salt: user.salt,
  });

  if (!isPasswordValid) {
    logger('Entered password is incorrect! 🚨');

    return {
      user: undefined,
      error: {
        code: ErrorCode.PASSWORD_OR_EMAIL_INCORRECT,
        message: ErrorMessage.PASSWORD_OR_EMAIL_INCORRECT,
      },
    };
  }

  return {
    user,
    error: { code: ErrorCode.ALL_RIGHT, message: ErrorMessage.ALL_RIGHT },
  };
};

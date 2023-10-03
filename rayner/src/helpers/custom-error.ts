import { ErrorCode, ErrorMessage } from './error-type';

export type ErrorExplanation = {
  code: ErrorCode;
  message: ErrorMessage;
};

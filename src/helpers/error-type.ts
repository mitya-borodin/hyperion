export enum ErrorType {
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  UNEXPECTED_BEHAVIOR = 'UNEXPECTED_BEHAVIOR',
}

export enum ErrorCode {
  ALL_RIGHT = 0,
  PASSWORD_OR_EMAIL_INCORRECT = 1,
  USER_EXISTS = 2,
}

export enum ErrorMessage {
  ALL_RIGHT = 'All right!',
  PASSWORD_OR_EMAIL_INCORRECT = 'Email or password incorrect!',
  USER_EXISTS = 'User already exist!',
}

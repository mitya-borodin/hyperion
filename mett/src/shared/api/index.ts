import * as auth from './auth';
import * as hardware from './hardware';
import * as user from './user';

export const api = {
  ...auth,
  ...user,
  ...hardware,
};

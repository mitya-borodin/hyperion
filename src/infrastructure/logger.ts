import getDebug from 'debug';

import { stringify } from '../helpers/json-stringify';

export type Logger = {
  fatal(value: string | { [key: string]: unknown }): void;
  error(value: string | { [key: string]: unknown }): void;
  warning(value: string | { [key: string]: unknown }): void;
  info(value: string | { [key: string]: unknown }): void;
  debug(value: string | { [key: string]: unknown }): void;
  trace(value: string | { [key: string]: unknown }): void;
};

export const getLogger = (scope: string) => {
  const fatal = getDebug(`error:${scope}`);
  const error = getDebug(`error:${scope}`);
  const warning = getDebug(`error:${scope}`);
  const info = getDebug(`error:${scope}`);
  const debug = getDebug(`error:${scope}`);
  const trace = getDebug(`error:${scope}`);

  return {
    fatal(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        fatal(value);
      } else {
        fatal(stringify(value));
      }
    },
    error(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        error(value);
      } else {
        error(stringify(value));
      }
    },
    warning(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        warning(value);
      } else {
        warning(stringify(value));
      }
    },
    info(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        info(value);
      } else {
        info(stringify(value));
      }
    },
    debug(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        debug(value);
      } else {
        debug(stringify(value));
      }
    },
    trace(value: string | { [key: string]: unknown }) {
      if (typeof value === 'string') {
        trace(value);
      } else {
        trace(stringify(value));
      }
    },
  };
};

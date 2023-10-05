import crypto from 'node:crypto';

import { Config } from '../infrastructure/config';

export type CreatePasswordHash = {
  config: Config;
  password: string;
};

export const createPasswordHash = ({ config, password }: CreatePasswordHash) => {
  const hash = (secret: string, salt: string): string => {
    return crypto.pbkdf2Sync(secret, salt, 1000, 120, 'sha512').toString('hex');
  };

  const salt = crypto.randomBytes(20).toString('hex');
  const saltWithMagic = hash(salt, config.fastify.auth.salt);
  const passwordHash = hash(password, saltWithMagic);

  return { salt, passwordHash };
};

import crypto from 'node:crypto';

import { Config } from '../infrastructure/config';

export type ComparePasswords = {
  config: Config;
  salt: string;
  originalPasswordHash: string;
  password: string;
};

const hash = (secret: string, salt: string): string => {
  return crypto.pbkdf2Sync(secret, salt, 1000, 120, 'sha512').toString('hex');
};

export const comparePasswords = ({ config, password, salt, originalPasswordHash }: ComparePasswords) => {
  const saltWithMagic = hash(salt, config.fastify.auth.salt);
  const passwordHash = hash(password, saltWithMagic);

  return passwordHash === originalPasswordHash;
};

/* eslint-disable max-len */
import { exit } from 'node:process';

import debug from 'debug';

import { UserRole } from '../../../domain/user';
import { createPasswordHash } from '../../../helpers/create-password-hash';
import { UserPort } from '../../../ports/user-port';
import { Config } from '../../config';

export type UserSeed = {
  config: Config;

  userRepository: UserPort;
};

export const userSeed = async ({ config, userRepository }: UserSeed) => {
  let masterUser = await userRepository.getByEmail(config.masterUser.email);

  if (masterUser instanceof Error) {
    exit(1);
  }

  if (masterUser) {
    debug('hyperion-The master user already created ✅');

    return;
  }

  const { passwordHash, salt } = createPasswordHash({ config, password: config.masterUser.password });

  masterUser = await userRepository.create({
    email: config.masterUser.email,
    name: config.masterUser.name,
    role: UserRole.ADMIN,
    hash: passwordHash,
    salt,
  });

  if (masterUser instanceof Error) {
    exit(1);
  }
};

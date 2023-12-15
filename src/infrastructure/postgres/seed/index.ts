import { exit } from 'node:process';

import { PrismaClient } from '@prisma/client';
import debug from 'debug';

import { Config } from '../../config';
import { SettingsRepository } from '../repository/settings-repository';
import { UserRepository } from '../repository/user-repository';

import { settingsSeed } from './settings-seed';
import { userSeed } from './user-seed';

const config = new Config();

const logger = debug('seed');

const seed = async () => {
  const prismaClient = new PrismaClient();

  await prismaClient.$connect();

  const settingsRepository = new SettingsRepository({ client: prismaClient });
  const userRepository = new UserRepository({ config, client: prismaClient });

  await userSeed({ config, userRepository });

  /**
   * ! Настройки всегда заполняются в самый последний момент, так как
   * ! там выставляется настройка демонстрирующая, что сидинг завершен.
   */
  await settingsSeed({ settingsRepository });

  logger('Seeding completed successfully ✅');

  exit(0);
};

seed();

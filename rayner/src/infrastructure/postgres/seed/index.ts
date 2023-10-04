import os from 'node:os';
import { exit } from 'node:process';

import { PrismaClient } from '@prisma/client';
import { pino } from 'pino';

import { Config } from '../../config';

import { settingsSeed } from './settings-seed';

import { SettingsRepository } from '../repository/settings-repository';

import { userSeed } from './user-seed';

import { UserRepository } from '../repository/user-repository';

const config = new Config();

const logger = pino({
  name: 'Seed entry point',
  base: {
    pid: process.pid,
    appName: config.appName,
    hostname: os.hostname(),
  },
  level: config.log.level,
  transport: {
    target: 'pino-pretty',
  },
});

const seed = async () => {
  const prismaClient = new PrismaClient();

  await prismaClient.$connect();

  const settingsRepository = new SettingsRepository({ logger, client: prismaClient });
  const userRepository = new UserRepository({ config, logger, client: prismaClient });

  await userSeed({ config, logger: logger.child({ name: 'UserSeed' }), userRepository });

  /**
   * ! Настройки всегда заполняются в самый последний момент, так как
   * ! там выставляется настройка демонстрирующая, что сидинг завершен.
   */
  await settingsSeed({ logger: logger.child({ name: 'SettingsSeed' }), settingsRepository });

  logger.info('Seeding completed successfully ✅');

  exit(0);
};

seed();

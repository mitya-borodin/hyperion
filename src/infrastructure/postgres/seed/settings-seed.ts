import debug from 'debug';

import { SettingType } from '../../../domain/settings';
import { ISettingsRepository } from '../../../ports/settings-repository';

const logger = debug('settings-seed');

export type SettingsSeed = {
  settingsRepository: ISettingsRepository;
};

export const settingsSeed = async ({ settingsRepository }: SettingsSeed) => {
  try {
    const seedIsComplete = await settingsRepository.hasSeed();

    if (seedIsComplete instanceof Error) {
      const seedSetting = await settingsRepository.create({
        key: SettingType.SEED_IS_COMPLETE,
        value: JSON.stringify(true),
      });

      if (seedSetting instanceof Error) {
        logger('Something went wrong while creating seed complete setting');

        return;
      }

      logger('Settings have been set successfully ✅');
      logger(JSON.stringify({ seedSetting }, null, 2));
    }
  } catch (error) {
    logger('Failed to fill in the settings 🚨');
    logger(JSON.stringify({ error }, null, 2));
  }
};

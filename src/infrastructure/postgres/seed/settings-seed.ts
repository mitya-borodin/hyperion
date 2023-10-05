import { Logger } from 'pino';

import { SettingType } from '../../../domain/settings';
import { ISettingsRepository } from '../../../ports/settings-repository';

export type SettingsSeed = {
  logger: Logger;
  settingsRepository: ISettingsRepository;
};

export const settingsSeed = async ({ logger, settingsRepository }: SettingsSeed) => {
  try {
    const seedIsComplete = await settingsRepository.hasSeed();

    if (seedIsComplete instanceof Error) {
      const seedSetting = await settingsRepository.create({
        key: SettingType.SEED_IS_COMPLETE,
        value: JSON.stringify(true),
      });

      if (seedSetting instanceof Error) {
        logger.error('Something went wrong while creating seed complete setting');

        return;
      }

      logger.info({ seedSetting }, 'Settings have been set successfully ✅');
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to fill in the settings 🚨');
  }
};

import { Settings as PrismaSettings } from '@prisma/client';

import { Settings, SettingType } from '../../domain/settings';

export const toDomainSettings = (prismaSettings: PrismaSettings): Settings => {
  const name = SettingType.SEED_IS_COMPLETE;

  return {
    [name]: JSON.parse(prismaSettings.value),
  };
};

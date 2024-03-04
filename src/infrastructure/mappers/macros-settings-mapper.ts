import { Macros as PrismaMacros } from '@prisma/client';

import { SettingsBase } from '../../domain/macroses/macros';
import { toDomainMacrosType } from '../../domain/macroses/macros-showcase';
import { MacrosSettings } from '../../ports/macros-settings-repository';

export const toDomainMacrosSettings = (prismaMacros: PrismaMacros): MacrosSettings => {
  return {
    type: toDomainMacrosType(prismaMacros.type),

    id: prismaMacros.id,
    name: prismaMacros.name,
    description: prismaMacros.description,
    labels: prismaMacros.labels,

    settings: prismaMacros.settings as SettingsBase,
  };
};

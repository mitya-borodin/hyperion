import { Macros as PrismaMacros } from '@prisma/client';

import { SettingsBase, StateBase } from '../../domain/macros/macros';
import { toDomainMacrosType } from '../../domain/macros/showcase';
import { MacrosData } from '../../ports/macros-settings-port';

export const toDomainMacrosSettings = (prismaMacros: PrismaMacros): MacrosData => {
  return {
    type: toDomainMacrosType(prismaMacros.type),

    id: prismaMacros.id,
    name: prismaMacros.name ?? '',
    description: prismaMacros.description ?? '',
    labels: prismaMacros.labels,

    settings: prismaMacros.settings as SettingsBase,
    state: prismaMacros.state as StateBase,

    version: prismaMacros.version,
  };
};

import { Macros as PrismaMacros } from '@prisma/client';

import { MacrosType, SettingsBase } from '../../domain/macroses/macros';
import { MacrosSettings } from '../../ports/macros-settings-repository';

export const toDomainMacrosSettings = (prismaMacros: PrismaMacros): MacrosSettings => {
  let type = MacrosType.LIGHTING;

  if (prismaMacros.type === MacrosType.LIGHTING) {
    type = MacrosType.LIGHTING;
  }

  if (prismaMacros.type === MacrosType.HEATING) {
    type = MacrosType.HEATING;
  }

  if (prismaMacros.type === MacrosType.VENTILATION) {
    type = MacrosType.VENTILATION;
  }

  if (prismaMacros.type === MacrosType.HUMIDIFICATION) {
    type = MacrosType.HUMIDIFICATION;
  }

  if (prismaMacros.type === MacrosType.CONDITIONING) {
    type = MacrosType.CONDITIONING;
  }

  if (prismaMacros.type === MacrosType.WATER_SUPPLY) {
    type = MacrosType.WATER_SUPPLY;
  }

  if (prismaMacros.type === MacrosType.SNOW_MELTING) {
    type = MacrosType.SNOW_MELTING;
  }

  if (prismaMacros.type === MacrosType.SWIMMING_POOL) {
    type = MacrosType.SWIMMING_POOL;
  }

  if (prismaMacros.type === MacrosType.COVER_OPENING) {
    type = MacrosType.COVER_OPENING;
  }

  if (prismaMacros.type === MacrosType.HEATING_CABLE) {
    type = MacrosType.HEATING_CABLE;
  }

  if (prismaMacros.type === MacrosType.MASTER_SWITCH) {
    type = MacrosType.MASTER_SWITCH;
  }

  if (prismaMacros.type === MacrosType.SECURITY) {
    type = MacrosType.SECURITY;
  }

  if (prismaMacros.type === MacrosType.ACCOUNTING) {
    type = MacrosType.ACCOUNTING;
  }

  if (prismaMacros.type === MacrosType.UPS) {
    type = MacrosType.UPS;
  }

  if (prismaMacros.type === MacrosType.AUTOMATIC_RESERVE_ENTRY) {
    type = MacrosType.AUTOMATIC_RESERVE_ENTRY;
  }

  return {
    id: prismaMacros.id,
    type,
    name: prismaMacros.name,
    description: prismaMacros.description,
    labels: prismaMacros.labels,
    settings: prismaMacros.settings as SettingsBase,
  };
};

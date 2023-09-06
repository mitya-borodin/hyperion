/* eslint-disable unicorn/no-array-reduce */
import {
  HyperionDeviceControl as HyperionDeviceControlPrisma,
  HyperionDevice as HyperionDevicePrisma,
} from '@prisma/client';

import { HyperionDevice, HyperionDeviceControl } from '../../domain/hyperion-device';

export const toDomainHyperionDevice = (
  prismaHyperionDevice: HyperionDevicePrisma & { controls: HyperionDeviceControlPrisma[] },
): HyperionDevice => {
  return {
    id: prismaHyperionDevice.id,
    driver: prismaHyperionDevice.driver,
    title: JSON.parse(prismaHyperionDevice.title),
    error: JSON.parse(prismaHyperionDevice.error),
    meta: JSON.parse(prismaHyperionDevice.meta),
    controls: prismaHyperionDevice.controls
      .map<HyperionDeviceControl>((control) => {
        return {
          id: control.id,
          title: JSON.parse(control.title),
          order: control.order,
          readonly: control.readonly,
          type: control.type,
          units: control.units,
          max: control.max,
          min: control.min,
          precision: control.precision,
          value: JSON.parse(control.value),
          topic: control.topic,
          error: control.error,
          meta: JSON.parse(control.meta),
        };
      })
      .sort((a, b) => (a.order > b.order ? 1 : -1)),
  };
};

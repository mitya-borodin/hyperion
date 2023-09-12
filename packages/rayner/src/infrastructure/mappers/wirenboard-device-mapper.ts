/* eslint-disable unicorn/no-array-reduce */
import { Device as DevicePrisma, Control as DeviceControlPrisma } from '@prisma/client';

import { HyperionDeviceControl } from '../../domain/hyperion-control';
import { HyperionDevice } from '../../domain/hyperion-device';

export const toDomainDevice = (
  prismaHyperionDevice: DevicePrisma & { controls: DeviceControlPrisma[] },
): HyperionDevice => {
  const markup = JSON.parse(prismaHyperionDevice.markup);

  return {
    id: prismaHyperionDevice.deviceId,
    driver: prismaHyperionDevice.driver,
    title: JSON.parse(prismaHyperionDevice.title),
    error: JSON.parse(prismaHyperionDevice.error),
    meta: JSON.parse(prismaHyperionDevice.meta),
    markup: {
      title: {
        ru: markup?.title?.ru ?? '',
        en: markup?.title?.en ?? '',
      },
      description: markup?.description ?? '',
      order: markup?.order ?? -1,
      color: markup?.color ?? '#FFFFFF',
    },
    labels: prismaHyperionDevice.labels,
    controls: prismaHyperionDevice.controls
      .map<HyperionDeviceControl>((control) => {
        const markup = JSON.parse(control.markup);

        return {
          id: control.controlId,
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
          markup: {
            title: {
              ru: markup?.title?.ru ?? '',
              en: markup?.title?.en ?? '',
            },
            description: markup?.description ?? '',
            order: markup?.order ?? -1,
            color: markup?.color ?? '#FFFFFF',
          },
          labels: control.labels,
        };
      })
      .sort((a, b) => {
        let aOrder = a.order;
        let bOrder = b.order;

        if (a.markup.order >= 0) {
          aOrder = a.markup.order;
        }

        if (b.markup.order >= 0) {
          bOrder = b.markup.order;
        }

        return aOrder > bOrder ? 1 : -1;
      }),
  };
};

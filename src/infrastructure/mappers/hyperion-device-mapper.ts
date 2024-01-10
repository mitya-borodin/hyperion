/* eslint-disable unicorn/no-array-reduce */
import { Device as DevicePrisma, Control as DeviceControlPrisma } from '@prisma/client';

import { ControlType } from '../../domain/control-type';
import { HyperionDeviceControl } from '../../domain/hyperion-control';
import { HyperionDevice } from '../../domain/hyperion-device';

export const toDomainDevice = (
  prismaHyperionDevice: DevicePrisma & { controls: DeviceControlPrisma[] },
): HyperionDevice => {
  const markup = JSON.parse(prismaHyperionDevice.markup);

  return {
    id: prismaHyperionDevice.deviceId,

    title: JSON.parse(prismaHyperionDevice.title),
    order: prismaHyperionDevice.order,

    driver: prismaHyperionDevice.driver,

    error: JSON.parse(prismaHyperionDevice.error),

    meta: JSON.parse(prismaHyperionDevice.meta),

    labels: prismaHyperionDevice.labels,

    markup: {
      title: {
        ru: markup?.title?.ru ?? '',
        en: markup?.title?.en ?? '',
      },
      description: markup?.description ?? '',
      order: markup?.order ?? -1,
      color: markup?.color ?? '#FFFFFF',
    },

    controls: prismaHyperionDevice.controls
      .map<HyperionDeviceControl>((control) => {
        const markup = JSON.parse(control.markup);

        /**
         * * CONTROL_TYPE_MAPPER
         */
        let type: ControlType = ControlType.UNSPECIFIED;

        if (control.type === ControlType.SWITCH) {
          type = ControlType.SWITCH;
        }

        if (control.type === ControlType.ILLUMINATION) {
          type = ControlType.ILLUMINATION;
        }

        if (control.type === ControlType.TEXT) {
          type = ControlType.TEXT;
        }

        if (control.type === ControlType.ENUM) {
          type = ControlType.ENUM;
        }

        if (control.type === ControlType.VALUE) {
          type = ControlType.VALUE;
        }

        if (control.type === ControlType.VOLTAGE) {
          type = ControlType.VOLTAGE;
        }

        if (control.type === ControlType.TEMPERATURE) {
          type = ControlType.TEMPERATURE;
        }

        if (control.type === ControlType.RANGE) {
          type = ControlType.RANGE;
        }

        if (control.type === ControlType.PUSH_BUTTON) {
          type = ControlType.PUSH_BUTTON;
        }

        if (control.type === ControlType.PRESSURE) {
          type = ControlType.PRESSURE;
        }

        if (control.type === ControlType.SOUND_LEVEL) {
          type = ControlType.SOUND_LEVEL;
        }

        if (control.type === ControlType.REL_HUMIDITY) {
          type = ControlType.REL_HUMIDITY;
        }

        if (control.type === ControlType.ATMOSPHERIC_PRESSURE) {
          type = ControlType.ATMOSPHERIC_PRESSURE;
        }

        return {
          id: control.controlId,

          title: JSON.parse(control.title),
          order: control.order,

          type,

          readonly: control.readonly,

          units: control.units,

          max: control.max,
          min: control.min,
          step: control.step,
          precision: control.precision,

          on: control.on,
          off: control.off,
          toggle: control.toggle,

          enum: control.enum,

          value: control.value,
          presets: JSON.parse(control.presets),

          topic: control.topic,

          error: control.error,

          meta: JSON.parse(control.meta),

          labels: control.labels,

          markup: {
            title: {
              ru: markup?.title?.ru ?? '',
              en: markup?.title?.en ?? '',
            },
            description: markup?.description ?? '',
            order: markup?.order ?? -1,
            color: markup?.color ?? '#FFFFFF',
          },
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

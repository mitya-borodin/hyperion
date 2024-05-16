/* eslint-disable unicorn/no-array-reduce */
import { Control as ControlPrisma, Device as DevicePrisma } from '@prisma/client';

import { HyperionDevice } from '../../domain/hyperion-device';

type Device = Omit<DevicePrisma, 'createdAt'> & { deviceId: string };
type Control = Omit<ControlPrisma, 'createdAt'> & { deviceId: string };

export const fromHyperionToPrisma = (
  hyperionDevices: HyperionDevice[] | IterableIterator<HyperionDevice>,
): { devices: Device[]; controls: Control[] } => {
  const devices: Device[] = [];
  const controls: Control[] = [];

  for (const device of hyperionDevices) {
    devices.push({
      deviceId: device.id,
      title: JSON.stringify(device.title),
      order: Number(device.order),
      driver: String(device.driver),
      error: JSON.stringify(device.error),
      meta: JSON.stringify(device.meta),
      labels: device.labels.map(String),
      markup: JSON.stringify(device.markup),
      updatedAt: new Date(),
    });

    for (const control of device.controls) {
      controls.push({
        deviceId: device.id,
        controlId: control.id,
        title: JSON.stringify(control.title),
        order: Number(control.order),
        type: String(control.type),
        readonly: Boolean(control.readonly),
        units: String(control.units),
        max: Number(control.max),
        min: Number(control.min),
        step: Number(control.step),
        precision: Number(control.precision),
        on: String(control.on),
        off: String(control.off),
        toggle: String(control.toggle),
        enum: control.enum.map(String),
        value: String(control.value),
        presets: JSON.stringify(control.presets),
        topic: JSON.stringify(control.topic),
        error: String(control.error),
        meta: JSON.stringify(control.meta),
        labels: control.labels.map(String),
        markup: JSON.stringify(control.markup),
        updatedAt: new Date(),
      });
    }
  }

  return {
    devices,
    controls,
  };
};

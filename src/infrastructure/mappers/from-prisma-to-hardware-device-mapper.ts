/* eslint-disable unicorn/no-array-reduce */
import { Control as DeviceControlPrisma, Device as DevicePrisma } from '@prisma/client';

import { HardwareDevice } from '../../domain/hardware-device';

export const fromPrismaToHardwareDevice = (
  prismaHyperionDevice: DevicePrisma & { controls: DeviceControlPrisma[] },
): HardwareDevice => {
  const hardwareDevice: HardwareDevice = {
    id: prismaHyperionDevice.deviceId,
    controls: {},
  };

  hardwareDevice.title = JSON.parse(prismaHyperionDevice.title);
  hardwareDevice.order = prismaHyperionDevice.order;
  hardwareDevice.driver = prismaHyperionDevice.driver;
  hardwareDevice.error = JSON.parse(prismaHyperionDevice.error);
  hardwareDevice.meta = JSON.parse(prismaHyperionDevice.meta);

  for (const control of prismaHyperionDevice.controls) {
    if (hardwareDevice.controls) {
      hardwareDevice.controls[control.controlId] = {
        id: control.controlId,
        title: JSON.parse(control.title),
        order: control.order,
        type: control.type,
        readonly: control.readonly,
        units: control.units,
        max: control.max,
        min: control.min,
        step: control.step,
        precision: control.precision,
        on: control.on,
        off: control.off,
        toggle: control.toggle,
        value: control.value,
        presets: JSON.parse(control.presets),
        topic: JSON.parse(control.topic),
        error: control.error,
        meta: JSON.parse(control.meta),
      };
    }
  }

  return hardwareDevice;
};

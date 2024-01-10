/* eslint-disable unicorn/no-array-reduce */

import { HardwareDevice } from '../../domain/hardware-device';

export const toPrismaHardwareDevice = (hardwareDevice: HardwareDevice) => {
  const device = {
    id: hardwareDevice.id,

    title: hardwareDevice.title
      ? JSON.stringify({
          ru: hardwareDevice.title?.ru,
          en: hardwareDevice.title?.en,
        })
      : undefined,
    order: hardwareDevice.order,

    driver: hardwareDevice.driver,

    error: hardwareDevice.error ? JSON.stringify(hardwareDevice.error) : undefined,

    meta: hardwareDevice.meta ? JSON.stringify(hardwareDevice.meta) : undefined,
  };

  const controls = Object.values(hardwareDevice.controls ?? {}).map((control) => {
    return {
      id: control.id,

      title: control.title
        ? JSON.stringify({
            ru: control.title?.ru,
            en: control.title?.en,
          })
        : undefined,
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

      enum: control.enum,

      value: control.value,
      presets: control.presets ? JSON.stringify(control.presets) : undefined,

      topic: control.topic,

      error: control.error,

      meta: control.meta ? JSON.stringify(control.meta) : undefined,
    };
  });

  return {
    device,
    controls,
  };
};

/* eslint-disable unicorn/no-array-reduce */

import { HardwareDevice } from '../../domain/hardware-device';

export const toPrismaWirenboardDevice = (hardwareDevice: HardwareDevice) => {
  const device = {
    id: hardwareDevice.id,
    driver: hardwareDevice.driver,
    title: hardwareDevice.title
      ? JSON.stringify({
          ru: hardwareDevice.title?.ru,
          en: hardwareDevice.title?.en,
        })
      : undefined,
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
      readonly: control.readonly,
      type: control.type,
      units: control.units,
      max: control.max,
      min: control.min,
      precision: control.precision,
      value: control.value,
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

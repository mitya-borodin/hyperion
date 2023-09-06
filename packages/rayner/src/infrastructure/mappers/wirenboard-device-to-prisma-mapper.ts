/* eslint-disable unicorn/no-array-reduce */

import { WirenboardDevice } from '../external-resource-adapters/wirenboard/wirenboard-device';

export const toPrismaWirenboardDevice = (wirenboardDevice: WirenboardDevice) => {
  const device = {
    id: wirenboardDevice.id,
    driver: wirenboardDevice.driver,
    title: wirenboardDevice.title
      ? JSON.stringify({
          ru: wirenboardDevice.title?.ru,
          en: wirenboardDevice.title?.en,
        })
      : undefined,
    error: wirenboardDevice.error ? JSON.stringify(wirenboardDevice.error) : undefined,
    meta: wirenboardDevice.meta ? JSON.stringify(wirenboardDevice.meta) : undefined,
  };

  const controls = Object.values(wirenboardDevice.controls ?? {}).map((control) => {
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
      value: control.value ? JSON.stringify(control.value) : undefined,
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

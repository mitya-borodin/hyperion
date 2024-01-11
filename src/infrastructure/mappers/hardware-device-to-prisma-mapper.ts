/* eslint-disable unicorn/no-array-reduce */

import { HardwareDevice } from '../../domain/hardware-device';

type Device = {
  id: string;

  title?: string;
  order?: number;

  driver?: string;

  error?: string;

  meta?: string;
};

type Control = {
  id: string;

  title?: string;
  order?: number;

  type?: string;

  readonly?: boolean;

  units?: string;

  max?: number;
  min?: number;
  step?: number;
  precision?: number;

  on?: string;
  off?: string;
  toggle?: string;

  enum?: string[];

  value?: string;
  presets?: string;

  topic?: string;

  error?: string;

  meta?: string;
};

export const toPrismaHardwareDevice = (
  hardwareDevice: HardwareDevice,
): {
  device: Device;
  controls: Control[];
} => {
  const device = {
    id: hardwareDevice.id,

    title: hardwareDevice.title
      ? JSON.stringify({
          ru: hardwareDevice.title?.ru,
          en: hardwareDevice.title?.en,
        })
      : undefined,
    order: hardwareDevice.order === undefined ? undefined : Number(hardwareDevice.order),

    driver: hardwareDevice.driver === undefined ? undefined : String(hardwareDevice.driver),

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
      order: control.order === undefined ? undefined : Number(control.order),

      type: control.type === undefined ? undefined : String(control.type),

      readonly: control.readonly === undefined ? undefined : Boolean(control.readonly),

      units: control.units === undefined ? undefined : String(control.units),

      max: control.max === undefined ? undefined : Number(control.max),
      min: control.min === undefined ? undefined : Number(control.min),
      step: control.step === undefined ? undefined : Number(control.step),
      precision: control.precision === undefined ? undefined : Number(control.precision),

      on: control.on === undefined ? undefined : String(control.on),
      off: control.off === undefined ? undefined : String(control.off),
      toggle: control.toggle === undefined ? undefined : String(control.toggle),

      enum: control.enum === undefined ? undefined : [...control.enum],

      value: control.value === undefined ? undefined : String(control.value),
      presets: control.presets ? JSON.stringify(control.presets) : undefined,

      topic: control.topic === undefined ? undefined : String(control.topic),

      error: control.error === undefined ? undefined : String(control.error),

      meta: control.meta ? JSON.stringify(control.meta) : undefined,
    };
  });

  return {
    device,
    controls,
  };
};

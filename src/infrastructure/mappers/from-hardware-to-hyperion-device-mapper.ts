/* eslint-disable unicorn/no-array-reduce */

import { ControlType, toDomainControlType } from '../../domain/control-type';
import { HardwareControl, HardwareDevice } from '../../domain/hardware-device';
import { HyperionDeviceControl } from '../../domain/hyperion-control';
import { HyperionDevice } from '../../domain/hyperion-device';

type ToHyperionDevice = {
  hardwareDevice: HardwareDevice;
  hyperionDevice?: HyperionDevice;
  /**
   * ! Если true, то в списке контролов будут те которые находятся в HardwareDevice + те которы есть в HyperionDevice.
   * ! Если false, то в списке контролов будут только те которые находятся в HardwareDevice.
   */
  fill: boolean;
};

export const fromHardwareToHyperionDevice = ({
  hardwareDevice,
  hyperionDevice,
  fill,
}: ToHyperionDevice): HyperionDevice => {
  /**
   * ! Список имеющихся hyperion контролов, нужен для того:
   * ! 1. Чтобы наслаивать полученные данные, на данные контрола полученные ранее.
   * ! 2. Чтобы не терять уже полученные контролы, в рамках устройства.
   */
  const hyperionControls = new Map<string, HyperionDeviceControl>();

  for (const control of hyperionDevice?.controls ?? []) {
    hyperionControls.set(control.id, control);
  }

  /**
   * ! Перебираем полученные hardware контролы.
   * ! Контролы приходят кусками, по этому нужно заполнять данными hyperion контрола, если они есть.
   * ! В процессе удаляем hyperion контролы из hyperionControls, чтобы оставшиеся добавить в список.
   */
  const hyperionDeviceControls: HyperionDeviceControl[] = Object.values(hardwareDevice.controls ?? {}).map(
    (hardwareControl: HardwareControl) => {
      const hyperionDeviceControl = hyperionControls.get(hardwareControl.id);

      let type = toDomainControlType(hardwareControl.type);

      if (type === ControlType.UNSPECIFIED) {
        type = hyperionDeviceControl?.type ?? ControlType.UNSPECIFIED;
      }

      const control: HyperionDeviceControl = {
        id: hardwareControl.id,

        title: {
          ru: hardwareControl.title?.ru ?? hyperionDeviceControl?.title.ru ?? '',
          en: hardwareControl.title?.en ?? hyperionDeviceControl?.title.en ?? '',
        },
        order: hardwareControl.order ?? hyperionDeviceControl?.order ?? 0,

        type,

        readonly: hardwareControl.readonly ?? hyperionDeviceControl?.readonly ?? true,

        units: hardwareControl.units ?? hyperionDeviceControl?.units ?? '',

        max: hardwareControl.max ?? hyperionDeviceControl?.max ?? 0,
        min: hardwareControl.min ?? hyperionDeviceControl?.min ?? 0,
        step: hardwareControl.step ?? hyperionDeviceControl?.step ?? 0,
        precision: hardwareControl.precision ?? hyperionDeviceControl?.precision ?? 0,

        on: hardwareControl.on ?? hyperionDeviceControl?.on ?? '',
        off: hardwareControl.off ?? hyperionDeviceControl?.off ?? '',
        toggle: hardwareControl.toggle ?? hyperionDeviceControl?.toggle ?? '',

        enum: hardwareControl.enum ?? hyperionDeviceControl?.enum ?? [],

        value: hardwareControl.value ?? hyperionDeviceControl?.value ?? '',
        presets: hardwareControl.presets ?? hyperionDeviceControl?.presets ?? {},

        topic: hardwareControl.topic ?? hyperionDeviceControl?.topic,

        error: hardwareControl.error ?? hyperionDeviceControl?.error ?? '',

        meta: hardwareControl.meta ?? hyperionDeviceControl?.meta ?? {},

        labels: hyperionDeviceControl?.labels ?? [],

        markup: {
          title: {
            ru: hyperionDeviceControl?.markup.title.ru ?? '',
            en: hyperionDeviceControl?.markup.title.en ?? '',
          },
          description: hyperionDeviceControl?.markup.description ?? '',
          order: hyperionDeviceControl?.markup.order ?? -1,
          color: hyperionDeviceControl?.markup.color ?? '#FFFFFF',
        },
      };

      hyperionControls.delete(hardwareControl.id);

      return control;
    },
  );

  if (fill) {
    for (const control of hyperionControls.values()) {
      hyperionDeviceControls.push(control);
    }
  }

  return {
    id: hardwareDevice.id,

    title: {
      ru: hardwareDevice.title?.ru ?? hyperionDevice?.title.ru ?? '',
      en: hardwareDevice.title?.en ?? hyperionDevice?.title.en ?? '',
    },
    order: hardwareDevice.order ?? hyperionDevice?.order ?? 0,

    driver: hardwareDevice.driver ?? hyperionDevice?.driver ?? '',

    error: hardwareDevice.error ?? hyperionDevice?.error ?? {},

    meta: hardwareDevice.meta ?? hyperionDevice?.meta ?? {},

    labels: hyperionDevice?.labels ?? [],

    markup: {
      title: {
        ru: hyperionDevice?.markup.title.ru ?? '',
        en: hyperionDevice?.markup.title.en ?? '',
      },
      description: hyperionDevice?.markup.description ?? '',
      order: hyperionDevice?.markup.order ?? -1,
      color: hyperionDevice?.markup.color ?? '#FFFFFF',
    },

    controls: hyperionDeviceControls,
  };
};

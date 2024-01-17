/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { PrismaClient } from '@prisma/client';
import { compareDesc, subSeconds } from 'date-fns';
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';

import { HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDeviceControl } from '../../../domain/hyperion-control';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { History } from '../../../domain/hystory';
import { getControlId } from '../../../domain/macroses/get-control-id';
import { ErrorType } from '../../../helpers/error-type';
import { stringify } from '../../../helpers/json-stringify';
import {
  HyperionState,
  HyperionStateUpdate,
  IHyperionDeviceRepository,
  MarkupHyperionControl,
  MarkupHyperionDevice,
  SetControlValue,
} from '../../../ports/hyperion-device-repository';
import { fromPrismaToHyperionDevice } from '../../mappers/from-prisma-to-hyperion-device-mapper';
import { toHyperionDevice } from '../../mappers/to-hyperion-device-mapper';

const logger = debug('hyperion-device-repository');

type HyperionDeviceRepositoryParameters = {
  client: PrismaClient;
};

export class HyperionDeviceRepository implements IHyperionDeviceRepository {
  private client: PrismaClient;

  private history: Map<string, History[]>;
  private lastHistorySave: Date;

  private devices: Map<string, HyperionDevice>;
  private controls: Map<string, HyperionDeviceControl>;
  private lastDeviceSave: Date;

  constructor({ client }: HyperionDeviceRepositoryParameters) {
    this.client = client;

    this.history = new Map();
    this.lastHistorySave = new Date();

    this.devices = new Map();
    this.controls = new Map();
    this.lastDeviceSave = new Date();
  }

  apply(hardwareDevice: HardwareDevice): Error | HyperionStateUpdate {
    const deviceId = hardwareDevice.id;
    const hyperionDevice = this.devices.get(deviceId);

    if (hyperionDevice) {
      this.devices.set(deviceId, toHyperionDevice({ hardwareDevice, hyperionDevice, fill: true }));
    } else {
      this.devices.set(deviceId, toHyperionDevice({ hardwareDevice, fill: true }));
    }

    const device = this.devices.get(deviceId);

    if (!device) {
      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }

    const previous = new Map();

    for (const control of device.controls) {
      const controlId = getControlId({ deviceId, controlId: control.id });

      previous.set(controlId, cloneDeep(this.controls.get(controlId)));

      this.controls.set(controlId, control);
    }

    for (const { id, value, error } of Object.values(hardwareDevice.controls ?? {})) {
      if (value === undefined && error === undefined) {
        continue;
      }

      this.addToHistory({
        deviceId,
        controlId: id,
        value: value ?? '',
        error: error ?? '',
        createdAt: new Date(),
      });
    }

    this.saveDevices();

    return {
      previous,
      current: toHyperionDevice({ hardwareDevice, hyperionDevice, fill: false }),
      devices: this.devices,
      controls: this.controls,
    };
  }

  async getHyperionState(): Promise<HyperionState> {
    try {
      if (this.devices.size === 0 || this.controls.size === 0) {
        const prismaDevices = await this.client.device.findMany({
          include: {
            controls: true,
          },
        });

        const hyperionDevices = prismaDevices.map((element) => fromPrismaToHyperionDevice(element));

        for (const device of hyperionDevices) {
          this.devices.set(device.id, device);

          for (const control of device.controls) {
            this.controls.set(getControlId({ deviceId: device.id, controlId: control.id }), control);
          }
        }
      }

      return {
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to get hyperion state 🚨');

      console.error(error);

      return {
        devices: this.devices,
        controls: this.controls,
      };
    }
  }

  async markupDevice(parameters: MarkupHyperionDevice): Promise<Error | HyperionStateUpdate> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion device, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const previous = new Map<string, HyperionDeviceControl>();
      const device = this.devices.get(parameters.deviceId);

      if (device) {
        for (const control of device.controls) {
          previous.set(getControlId({ deviceId: device.id, controlId: control.id }), cloneDeep(control));
        }

        device.labels = parameters.labels ?? device.labels;
        device.markup.title.ru = parameters.markup?.title?.ru ?? device.markup.title.ru;
        device.markup.title.en = parameters.markup?.title?.en ?? device.markup.title.en;
        device.markup.order = parameters.markup?.order ?? device.markup.order;
        device.markup.color = parameters.markup?.color ?? device.markup.color;
      } else {
        logger('The hyperion device was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaDevice = await this.client.device.update({
        include: {
          controls: true,
        },
        where: {
          deviceId: parameters.deviceId,
        },
        data: {
          ...(parameters.markup ? { markup: JSON.stringify(parameters.markup) } : {}),
          ...(parameters.labels ? { labels: parameters.labels } : {}),
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice(prismaDevice),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to markup hyperion device 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupControl(parameters: MarkupHyperionControl): Promise<Error | HyperionStateUpdate> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion control, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const controlId = getControlId(parameters);
      const previous = new Map<string, HyperionDeviceControl>();
      const control = this.controls.get(controlId);

      if (control) {
        previous.set(controlId, cloneDeep(control));

        control.labels = parameters.labels ?? control.labels;
        control.markup.title.ru = parameters.markup?.title?.ru ?? control.markup.title.ru;
        control.markup.title.en = parameters.markup?.title?.en ?? control.markup.title.en;
        control.markup.order = parameters.markup?.order ?? control.markup.order;
        control.markup.color = parameters.markup?.color ?? control.markup.color;

        /**
         * TODO проверить, обновляются ли данные контролов в this.devices.
         */
      } else {
        logger('The hyperion control was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaControl = await this.client.control.update({
        include: {
          device: true,
        },
        where: {
          deviceId_controlId: {
            deviceId: parameters.deviceId,
            controlId: parameters.controlId,
          },
        },
        data: {
          ...(parameters.markup ? { markup: JSON.stringify(parameters.markup) } : {}),
          ...(parameters.labels ? { labels: parameters.labels } : {}),
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice({ ...prismaControl.device, controls: [prismaControl] }),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to markup hyperion control 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async setControlValue(parameters: SetControlValue): Promise<Error | HyperionStateUpdate> {
    try {
      const controlId = getControlId(parameters);
      const previous = new Map<string, HyperionDeviceControl>();
      const control = this.controls.get(controlId);

      if (control) {
        previous.set(controlId, cloneDeep(control));

        control.value = parameters.value;
        /**
         * TODO проверить, обновляются ли данные контролов в this.devices.
         */
      } else {
        logger('The hyperion control was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaControl = await this.client.control.update({
        include: {
          device: true,
        },
        where: {
          deviceId_controlId: {
            deviceId: parameters.deviceId,
            controlId: parameters.controlId,
          },
        },
        data: {
          value: parameters.value,
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice({ ...prismaControl.device, controls: [prismaControl] }),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to set value for hyperion control 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  private async addToHistory(item: History) {
    const controlId = getControlId({ deviceId: item.deviceId, controlId: item.controlId });
    const history = this.history.get(controlId);

    const parsed: History = {
      deviceId: String(item.deviceId),
      controlId: String(item.controlId),
      value: String(item.value),
      error: String(item.error),
      createdAt: item.createdAt,
    };

    if (history) {
      const last = history.at(-1);

      if (!last) {
        return;
      }

      if (compareDesc(last.createdAt, subSeconds(new Date(), 10)) === 1) {
        history.push(parsed);
      } else if (last.value !== item.value) {
        history.push(parsed);
      }
    } else {
      this.history.set(controlId, [parsed]);
    }

    if (compareDesc(this.lastHistorySave, subSeconds(new Date(), 5 * 60)) === 1) {
      const history: History[] = [];

      for (const item of this.history.values()) {
        history.push(...item);
      }

      this.history.clear();
      this.lastHistorySave = new Date();

      logger('Try to save history ⬆️ 🛟 ', history.length);

      this.client.history
        .createMany({ data: history })
        .then(() => {
          logger('The history was saved ⬆️ 🛟 ✅');
        })
        .catch((error) => {
          logger('The history was not saved 🚨 🚨 🚨');

          console.error(error);
        });
    }
  }

  private async saveDevices() {
    if (compareDesc(this.lastDeviceSave, subSeconds(new Date(), 60)) === 1) {
      const devices: Array<{
        deviceId: string;
        title?: string;
        order?: number;
        driver?: string;
        error?: string;
        meta?: string;
        labels?: string[];
        markup?: string;
        updatedAt?: Date | string;
      }> = [];
      const controls: Array<{
        deviceId: string;
        controlId: string;
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
        labels?: string[];
        markup?: string;
        updatedAt?: Date | string;
      }> = [];

      for (const device of this.devices.values()) {
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
            topic: String(control.topic),
            error: String(control.error),
            meta: JSON.stringify(control.meta),
            labels: control.labels.map(String),
            markup: JSON.stringify(control.markup),
            updatedAt: new Date(),
          });
        }
      }

      this.lastDeviceSave = new Date();

      logger('Try to save devices and controls ⬆️ 🛟 ', devices.length, controls.length);

      for (const device of devices) {
        await this.client.device.upsert({
          where: {
            deviceId: device.deviceId,
          },
          create: device,
          update: device,
        });
      }

      for (const control of controls) {
        await this.client.control.upsert({
          where: {
            deviceId_controlId: {
              deviceId: control.deviceId,
              controlId: control.controlId,
            },
          },
          create: control,
          update: control,
        });
      }

      logger('The devices and controls was saved ⬆️ 🛟 ✅ ');
    }
  }
}

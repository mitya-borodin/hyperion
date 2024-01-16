/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { PrismaClient } from '@prisma/client';
import { compareDesc, subSeconds } from 'date-fns';
import debug from 'debug';

import { ControlType } from '../../../domain/control-type';
import { HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { History } from '../../../domain/hystory';
import { getControlId } from '../../../domain/macroses/get-control-id';
import { ErrorType } from '../../../helpers/error-type';
import {
  IHyperionDeviceRepository,
  MarkupHyperionControl,
  MarkupHyperionDevice,
  SetControlValue,
} from '../../../ports/hyperion-device-repository';
import { toPrismaHardwareDevice } from '../../mappers/hardware-device-to-prisma-mapper';
import { toDomainDevice } from '../../mappers/hyperion-device-mapper';

const logger = debug('hyperion-device-repository');

type HyperionDeviceRepositoryParameters = {
  client: PrismaClient;
};

export class HyperionDeviceRepository implements IHyperionDeviceRepository {
  private client: PrismaClient;
  private history: Map<string, History[]>;
  private lastHistorySave: Date;

  constructor({ client }: HyperionDeviceRepositoryParameters) {
    this.client = client;
    this.history = new Map();
    this.lastHistorySave = new Date();
  }

  async apply(hardwareDevice: HardwareDevice): Promise<Error | HyperionDevice> {
    const { device, control } = toPrismaHardwareDevice(hardwareDevice);

    try {
      if (!device.id) {
        logger('To apply the hardware device information, you need to pass the identifier 🚨');
        logger(JSON.stringify(hardwareDevice, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      if (control && !control?.id) {
        logger('To apply the hardware device control information, you need to pass the identifier 🚨');
        logger(JSON.stringify(control, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaDevice = await this.client.device.upsert({
        create: {
          deviceId: device.id,

          title: device.title,
          order: device.order,

          driver: device.driver,

          error: device.error,

          meta: device.meta,
        },
        update: {
          deviceId: device.id,

          title: device.title,
          order: device.order,

          driver: device.driver,

          error: device.error,

          meta: device.meta,

          updatedAt: new Date(),
        },
        where: {
          deviceId: device.id,
        },
      });

      if (control) {
        const max = control.type === ControlType.RANGE ? control.max ?? 10 ^ 9 : control.max;
        const min = control.type === ControlType.RANGE ? control.min ?? 0 : control.min;

        const prismaControl = await this.client.control.upsert({
          create: {
            deviceId: device.id,
            controlId: control.id,

            title: control.title,
            order: control.order,

            type: control.type,

            readonly: control.readonly,

            units: control.units,

            max,
            min,
            step: control.step,
            precision: control.precision,

            on: control.on,
            off: control.off,
            toggle: control.toggle,

            enum: control.enum,

            value: control.value,
            presets: control.presets,

            topic: control.topic,

            error: control.error,

            meta: control.meta,
          },
          update: {
            deviceId: device.id,
            controlId: control.id,

            title: control.title,
            order: control.order,

            type: control.type,

            readonly: control.readonly,

            units: control.units,

            max,
            min,
            step: control.step,
            precision: control.precision,

            on: control.on,
            off: control.off,
            toggle: control.toggle,

            enum: control.enum,

            value: control.value,
            presets: control.presets,

            topic: control.topic,

            error: control.error,

            meta: control.meta,

            updatedAt: new Date(),
          },
          where: {
            deviceId: device.id,
            controlId: control.id,
            deviceId_controlId: {
              deviceId: device.id,
              controlId: control.id,
            },
          },
        });

        await this.addToHistory({
          deviceId: device.id,
          controlId: control.id,
          value: control.value ?? '0',
          error: control.error ?? 'UNSPECIFIED',
          createdAt: new Date(),
        });

        return toDomainDevice({ ...prismaDevice, controls: [prismaControl] });
      }

      return toDomainDevice({ ...prismaDevice, controls: [] });
    } catch (error) {
      logger('Unable to apply hardware device 🚨');
      logger(JSON.stringify({ hardwareDevice, device, control, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async getAll(): Promise<Error | HyperionDevice[]> {
    try {
      const prismaDevices = await this.client.device.findMany({
        include: {
          controls: true,
        },
      });

      return prismaDevices.map((prismaDevice) => toDomainDevice(prismaDevice));
    } catch (error) {
      logger('Unable to get all hardware devices 🚨');

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupDevice(parameters: MarkupHyperionDevice): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion device, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

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

      return toDomainDevice(prismaDevice);
    } catch (error) {
      logger('Unable to markup hyperion device 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupControl(parameters: MarkupHyperionControl): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion control, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

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

      return toDomainDevice({ ...prismaControl.device, controls: [prismaControl] });
    } catch (error) {
      logger('Unable to markup hyperion control 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async setControlValue(parameters: SetControlValue): Promise<Error | HyperionDevice> {
    try {
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

      return toDomainDevice({ ...prismaControl.device, controls: [prismaControl] });
    } catch (error) {
      logger('Unable to set value for hyperion control 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      console.error(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  private async addToHistory(item: History) {
    const historyId = getControlId({ deviceId: item.deviceId, controlId: item.controlId });
    const history = this.history.get(historyId);

    if (history) {
      const last = history.at(-1);

      if (!last) {
        return;
      }

      if (compareDesc(last.createdAt, subSeconds(new Date(), 10)) === 1) {
        history.push(item);
      } else if (last.value !== item.value) {
        history.push(item);
      }
    } else {
      this.history.set(historyId, [item]);
    }

    if (compareDesc(this.lastHistorySave, subSeconds(new Date(), 20)) === 1) {
      const history: History[] = [];

      for (const item of this.history.values()) {
        history.push(...item);
      }

      this.history.clear();
      this.lastHistorySave = new Date();

      logger('Save history ⬆️ 🛟', history.length);

      await this.client.history.createMany({ data: history });
    }
  }
}

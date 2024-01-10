/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { Control, PrismaClient } from '@prisma/client';
import debug from 'debug';

import { ControlType } from '../../../domain/control-type';
import { HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import {
  IHyperionDeviceRepository,
  MarkupHyperionControl,
  MarkupHyperionDevice,
  SetControlValue,
} from '../../../ports/hyperion-device-repository';
import { toDomainDevice } from '../../mappers/hyperion-device-mapper';
import { toPrismaHardwareDevice } from '../../mappers/hyperion-device-to-prisma-mapper';

const logger = debug('hyperion-device-repository');

type HyperionDeviceRepositoryParameters = {
  client: PrismaClient;
};

export class HyperionDeviceRepository implements IHyperionDeviceRepository {
  private client: PrismaClient;

  constructor({ client }: HyperionDeviceRepositoryParameters) {
    this.client = client;
  }

  async apply(hardwareDevice: HardwareDevice): Promise<Error | HyperionDevice> {
    const { device, controls } = toPrismaHardwareDevice(hardwareDevice);

    try {
      if (!device.id) {
        logger('To apply the hardware device information, you need to pass the identifier 🚨');
        logger(JSON.stringify(hardwareDevice, null, 2));

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

      const prismaControls = await Promise.all(
        controls.map(async (control) => {
          if (!control.id) {
            logger('To apply the hardware device control information, you need to pass the identifier 🚨');
            logger(JSON.stringify(control, null, 2));

            return new Error(ErrorType.INVALID_ARGUMENTS);
          }

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

          await this.client.history.create({
            data: {
              deviceId: device.id,
              controlId: control.id,
              value: control.value,
              error: control.error,
            },
          });

          return prismaControl;
        }),
      );

      const prismaControlsWithOutError: Control[] = [];

      for (const prismaControl of prismaControls) {
        if (prismaControl instanceof Error) {
          continue;
        }

        prismaControlsWithOutError.push(prismaControl);
      }
      const hyperionDevice = toDomainDevice({
        ...prismaDevice,
        controls: prismaControlsWithOutError,
      });

      return hyperionDevice;
    } catch (error) {
      logger('Unable to apply hardware device 🚨');
      logger(JSON.stringify({ hardwareDevice, device, controls, error }, null, 2));

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
      logger(JSON.stringify({ error }, null, 2));

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

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

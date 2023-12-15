/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { Control, PrismaClient } from '@prisma/client';
import debug from 'debug';

import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import {
  IWirenboardDeviceRepository,
  MarkupWirenboardControl,
  MarkupWirenboardDevice,
  SetControlValue,
} from '../../../ports/wirenboard-device-repository';
import { WirenboardDevice } from '../../external-resource-adapters/wirenboard/wirenboard-device';
import { toDomainDevice } from '../../mappers/wirenboard-device-mapper';
import { toPrismaWirenboardDevice } from '../../mappers/wirenboard-device-to-prisma-mapper';

const logger = debug('wirenboard-device-repository');

type WirenboardDeviceRepositoryParameters = {
  client: PrismaClient;
};

export class WirenboardDeviceRepository implements IWirenboardDeviceRepository {
  private client: PrismaClient;

  constructor({ client }: WirenboardDeviceRepositoryParameters) {
    this.client = client;
  }

  async apply(wirenboardDevice: WirenboardDevice): Promise<Error | HyperionDevice> {
    const { device, controls } = toPrismaWirenboardDevice(wirenboardDevice);

    try {
      if (!device.id) {
        logger('To apply the device information, you need to pass the identifier 🚨');
        logger(JSON.stringify(wirenboardDevice, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaDevice = await this.client.device.upsert({
        create: {
          deviceId: device.id,
          driver: device.driver,
          title: device.title,
          error: device.error,
          meta: device.meta,
        },
        update: {
          deviceId: device.id,
          driver: device.driver,
          title: device.title,
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
            logger('To apply the device control information, you need to pass the identifier 🚨');
            logger(JSON.stringify(control, null, 2));

            return new Error(ErrorType.INVALID_ARGUMENTS);
          }

          const prismaControl = await this.client.control.upsert({
            create: {
              deviceId: device.id,
              controlId: control.id,
              title: control.title,
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
              meta: control.meta,
            },
            update: {
              deviceId: device.id,
              controlId: control.id,
              title: control.title,
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
      logger('Unable to apply wirenboard device 🚨');
      logger(JSON.stringify({ wirenboardDevice, device, controls, error }, null, 2));

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
      logger('Unable to markup wirenboard device 🚨');
      logger(JSON.stringify({ error }, null, 2));

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupDevice(parameters: MarkupWirenboardDevice): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the device, you need to pass the markup parameters 🚨');
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
      logger('Unable to markup wirenboard device 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupControl(parameters: MarkupWirenboardControl): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the control, you need to pass the markup parameters 🚨');
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
      logger('Unable to markup wirenboard control 🚨');
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
      logger('Unable to markup wirenboard control 🚨');
      logger(JSON.stringify({ parameters, error }, null, 2));

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { Control, PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import {
  IWirenboardDeviceRepository,
  MarkupWirenboardControl,
  MarkupWirenboardDevice,
} from '../../../ports/wirenboard-device-repository';
import { WirenboardDevice } from '../../external-resource-adapters/wirenboard/wirenboard-device';
import { toDomainDevice } from '../../mappers/wirenboard-device-mapper';
import { toPrismaWirenboardDevice } from '../../mappers/wirenboard-device-to-prisma-mapper';

type WirenboardDeviceRepositoryParameters = {
  logger: Logger;
  client: PrismaClient;
};

export class WirenboardDeviceRepository implements IWirenboardDeviceRepository {
  private logger: Logger;
  private client: PrismaClient;

  constructor({ logger, client }: WirenboardDeviceRepositoryParameters) {
    this.logger = logger.child({ name: 'WirenboardDeviceRepository' });
    this.client = client;
  }

  async apply(wirenboardDevice: WirenboardDevice): Promise<Error | HyperionDevice> {
    const { device, controls } = toPrismaWirenboardDevice(wirenboardDevice);

    try {
      if (!device.id) {
        this.logger.error(
          { wirenboardDevice: JSON.stringify(wirenboardDevice, null, 2) },
          'To apply the device information, you need to pass the identifier 🚨',
        );

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
            this.logger.error(
              { control },
              'To apply the device control information, you need to pass the identifier 🚨',
            );

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

      this.logger.trace({ hyperionDevice }, 'The device with control has been successfully applied to the database ✅');

      return hyperionDevice;
    } catch (error) {
      this.logger.error({ wirenboardDevice, device, controls, err: error }, 'Unable to apply wirenboard device 🚨');

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
      this.logger.error({ err: error }, 'Unable to markup wirenboard device 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupDevice(parameters: MarkupWirenboardDevice): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        this.logger.error({ parameters }, 'To mark up the device, you need to pass the markup parameters 🚨');

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
      this.logger.error({ parameters, err: error }, 'Unable to markup wirenboard device 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupControl(parameters: MarkupWirenboardControl): Promise<Error | HyperionDevice> {
    try {
      if (!parameters.markup && !parameters.labels) {
        this.logger.error({ parameters }, 'To mark up the control, you need to pass the markup parameters 🚨');

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
      this.logger.error({ parameters, err: error }, 'Unable to markup wirenboard control 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

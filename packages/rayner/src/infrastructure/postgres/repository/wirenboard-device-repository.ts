/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
import { HyperionDeviceControl, PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import { IWirenboardDeviceRepository } from '../../../ports/wirenboard-device-repository';
import { WirenboardDevice } from '../../external-resource-adapters/wirenboard/wirenboard-device';
import { toDomainHyperionDevice } from '../../mappers/wirenboard-device-mapper';
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

      const prismaDevice = await this.client.hyperionDevice.upsert({
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

          return await this.client.hyperionDeviceControl.upsert({
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
        }),
      );

      const prismaControlsWithOutError: HyperionDeviceControl[] = [];

      for (const prismaControl of prismaControls) {
        if (prismaControl instanceof Error) {
          continue;
        }

        prismaControlsWithOutError.push(prismaControl);
      }
      const hyperionDevice = toDomainHyperionDevice({
        ...prismaDevice,
        controls: prismaControlsWithOutError,
      });

      // eslint-disable-next-line max-len
      // this.logger.debug({ hyperionDevice }, 'The device with control has been successfully applied to the database ✅');

      return hyperionDevice;
    } catch (error) {
      this.logger.error({ wirenboardDevice, device, controls, err: error }, 'Unable to apply wirenboard device 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

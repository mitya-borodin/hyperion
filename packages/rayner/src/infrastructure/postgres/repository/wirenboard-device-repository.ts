import { PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

import { HyperionDevice } from '../../../domain/hyperion-device';
import { ErrorType } from '../../../helpers/error-type';
import { IWirenboardDeviceRepository } from '../../../ports/wirenboard-device-repository';
import { WirenboardDevice } from '../../external-resource-adapters/wirenboard/wirenboard-device';

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
    try {
      return {} as HyperionDevice;
    } catch (error) {
      this.logger.error({ wirenboardDevice, err: error }, 'Unable to apply wirenboard device 🚨');

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }
}

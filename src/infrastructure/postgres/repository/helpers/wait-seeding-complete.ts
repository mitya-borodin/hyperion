import { PrismaClient } from '@prisma/client';
import { delay } from 'abort-controller-x';
import { Logger } from 'pino';

import { SettingType } from '../../../../domain/settings';

type WaitPostgres = {
  signal: AbortSignal;
  logger: Logger;
  prismaClient: PrismaClient;
};

export const waitSeedingComplete = async ({ signal, logger, prismaClient }: WaitPostgres) => {
  await prismaClient.$connect();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const seedIsComplete = await prismaClient.settings.findFirst({
        where: {
          name: SettingType.SEED_IS_COMPLETE,
        },
      });

      if (!seedIsComplete) {
        logger.info({ seedIsComplete }, 'Postgresql has not been initialized yet 🌴');

        await delay(signal, 5000);

        continue;
      }

      if (seedIsComplete?.value) {
        logger.info('Postgresql has been initialized 🚀');

        return;
      }
    } catch {
      logger.info('Postgresql has not been initialized yet 🐌');
    }

    await delay(signal, 5000);
  }
};

import { PrismaClient } from '@prisma/client';
import { delay } from 'abort-controller-x';
import debug from 'debug';

import { SettingType } from '../../../../domain/settings';

const logger = debug('wait-seeding-complete');

type WaitPostgres = {
  signal: AbortSignal;
  prismaClient: PrismaClient;
};

export const waitSeedingComplete = async ({ signal, prismaClient }: WaitPostgres) => {
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
        logger('Postgresql has not been initialized yet 🌴');

        await delay(signal, 5000);

        continue;
      }

      if (seedIsComplete?.value) {
        logger('Postgresql has been initialized 🚀');

        return;
      }
    } catch {
      logger('Postgresql has not been initialized yet 🐌');
    }

    await delay(signal, 5000);
  }
};

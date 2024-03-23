/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/prefer-module */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import debug from 'debug';
import { createGenerator } from 'ts-json-schema-generator';

const logger = debug('generate-json-schema');

type Config = {
  tsconfig: string;
  path: string;
  type: string;
  output: string;
};

const generate = async (config: Config) => {
  const schema = createGenerator(config).createSchema(config.type);

  await writeFile(config.output, JSON.stringify(schema, null, 2));

  logger('Schema was builded ✅');
  logger(JSON.stringify({ config }, null, 2));
};

const basePath = resolve(__dirname, '../src/domain/macros');

Promise.all([
  /**
   * ! LIGHTING MACROS
   */
  generate({
    type: 'LightingMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'lighting/index.ts'),
    output: resolve(basePath, 'lighting/settings.json'),
  }),
  generate({
    type: 'LightingMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'lighting/index.ts'),
    output: resolve(basePath, 'lighting/state.json'),
  }),

  /**
   * ! WATER-SUPPLY MACROS
   */
  generate({
    type: 'WaterSupplyMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'water-supply/index.ts'),
    output: resolve(basePath, 'water-supply/settings.json'),
  }),
  generate({
    type: 'WaterSupplyMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'water-supply/index.ts'),
    output: resolve(basePath, 'water-supply/state.json'),
  }),
])
  .then(() => {
    logger('All schemas was builded ✅');
  })
  .catch((error) => {
    logger('Unable to build all schemas 🚨');

    console.error(error);
  });

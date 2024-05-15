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
   * ! BOILER MACROS
   */
  generate({
    type: 'BoilerMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'boiler/index.ts'),
    output: resolve(basePath, 'boiler/settings.json'),
  }),
  generate({
    type: 'BoilerMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'boiler/index.ts'),
    output: resolve(basePath, 'boiler/state.json'),
  }),

  /**
   * ! COUNTER MACROS
   */
  generate({
    type: 'CounterMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'counter/index.ts'),
    output: resolve(basePath, 'counter/settings.json'),
  }),
  generate({
    type: 'CounterMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'counter/index.ts'),
    output: resolve(basePath, 'counter/state.json'),
  }),

  /**
   * ! LEAKS MACROS
   */
  generate({
    type: 'LeaksMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'leaks/index.ts'),
    output: resolve(basePath, 'leaks/settings.json'),
  }),
  generate({
    type: 'LeaksMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'leaks/index.ts'),
    output: resolve(basePath, 'leaks/state.json'),
  }),

  /**
   * ! PUMP MACROS
   */
  generate({
    type: 'PumpMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'pump/index.ts'),
    output: resolve(basePath, 'pump/settings.json'),
  }),
  generate({
    type: 'PumpMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'pump/index.ts'),
    output: resolve(basePath, 'pump/state.json'),
  }),

  /**
   * ! PUMP MACROS
   */
  generate({
    type: 'RecirculationMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'recirculation/index.ts'),
    output: resolve(basePath, 'recirculation/settings.json'),
  }),
  generate({
    type: 'RecirculationMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'recirculation/index.ts'),
    output: resolve(basePath, 'recirculation/state.json'),
  }),
  /**
   * ! COVER MACROS
   */
  generate({
    type: 'CurtainMacrosSettings',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'curtain/index.ts'),
    output: resolve(basePath, 'curtain/settings.json'),
  }),
  generate({
    type: 'CurtainMacrosPublicState',
    tsconfig: resolve(__dirname, '../tsconfig.build.json'),
    path: resolve(basePath, 'curtain/index.ts'),
    output: resolve(basePath, 'curtain/state.json'),
  }),
])
  .then(() => {
    logger('All schemas was builded ✅');
  })
  .catch((error) => {
    logger('Unable to build all schemas 🚨');

    console.error(error);
  });

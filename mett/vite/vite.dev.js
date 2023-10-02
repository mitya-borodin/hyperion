import path from 'path';

import * as dotenv from 'dotenv';
import { mergeConfig } from 'vite';

import viteCommonConfig from './vite.common';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

export default mergeConfig(viteCommonConfig, {
  server: {
    port: process.env.PORT || 3000,
  },
});

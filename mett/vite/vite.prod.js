import { mergeConfig } from 'vite';
import * as dotenv from 'dotenv';
import path from 'path';
import viteCommonConfig from './vite.common';
import { visualizer } from 'rollup-plugin-visualizer';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

export default mergeConfig(viteCommonConfig, {
  base: process.env.VITE_BASE_PATH,

  plugins: [
    visualizer({
      template: 'treemap', // or sunburst
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html', // will be saved in project's root
    }),
  ],
});

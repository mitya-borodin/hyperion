import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    target: 'esnext',
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'http://127.0.0.1:5000',
        headers: { origin: 'http://127.0.0.1:5000' },
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    proxy: {
      '/graphql': {
        target: 'http://127.0.0.1:5000',
        headers: { origin: 'http://127.0.0.1:5000' },
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

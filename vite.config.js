import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        thankYou: resolve(import.meta.dirname, 'thank-you/index.html'),
      },
    },
    cssMinify: 'lightningcss',
    minify: 'terser',
  },
});

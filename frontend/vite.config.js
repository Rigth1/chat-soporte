import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: path.resolve(__dirname, './src/styles/quasar-variables.scss')
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});

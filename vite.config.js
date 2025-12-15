import { defineConfig, splitVendorChunkPlugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), nodePolyfills(), splitVendorChunkPlugin(), viteCommonjs()],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('hw-app-trx')) {
            return 'trx';
          }
          // creating a chunk to @open-ish deps. Reducing the vendor chunk size
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['hw-app-trx']
  }
});

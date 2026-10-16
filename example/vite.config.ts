import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Serve the library directly from its TypeScript source, so no separate build step is needed
      '@resonant/oauth-client': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
});

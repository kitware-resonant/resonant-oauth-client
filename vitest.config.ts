import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        url: 'http://www.example.com',
        settings: {
          fetch: {
            // happy-dom sends a CORS preflight for every cross-origin fetch, even "simple" requests
            // which real browsers send without one. To avoid needing to mock support for OPTIONS
            // (which isn't used in a production environment), disable CORS.
            disableSameOriginPolicy: true,
          },
        },
      },
    },
    coverage: {
      enabled: true,
      include: ['src'],
      reporter: ['text-summary', 'html'],
    },
    setupFiles: ['./tests/setup.ts'],
    execArgv: [
      '--localstorage-file',
      path.resolve(os.tmpdir(), `vitest-${process.pid}.localstorage`),
    ],
  },
});

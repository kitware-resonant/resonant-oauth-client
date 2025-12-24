import type { Window as HappyDomWindow } from 'happy-dom';
import { test as baseTest, vi } from 'vitest';

import OAuthClient from '../src/index.js';

// HappyDOM has its own version of Window with a few extra properties,
// so make them known to TypeScript
declare global {
  interface Window extends HappyDomWindow {}
}

export function buildClient(scopes: string[] = []): OAuthClient {
  return new OAuthClient(new URL('https://api.example.com'), 'resonant-client-id', { scopes });
}

export const test = baseTest.extend<{
  client: OAuthClient;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Vitest syntax requirement
  client: async ({}, use) => {
    const client = buildClient();
    use(client);
  },
});

test.afterEach(() => {
  // DOM must be manually reset between tests: https://github.com/vitest-dev/vitest/issues/682
  window.localStorage.clear();
  window.location.replace('http://www.example.com');
});

// Allow usage outside of a true HTTPS environment
vi.stubGlobal('isSecureContext', true);

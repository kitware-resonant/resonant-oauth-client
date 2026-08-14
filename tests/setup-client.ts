import { test as baseTest, vi } from 'vitest';

import OAuthClient from '../src/index.js';

export function buildClient(scopes: string[] = []): OAuthClient {
  return new OAuthClient(new URL('https://api.example.com'), 'resonant-client-id', { scopes });
}

export const test = baseTest.extend('client', () => buildClient());

test.afterEach(() => {
  // DOM must be manually reset between tests: https://github.com/vitest-dev/vitest/issues/682
  globalThis.localStorage.clear();
  globalThis.location.replace('http://www.example.com');
});

// Allow usage outside of a true HTTPS environment
vi.stubGlobal('isSecureContext', true);

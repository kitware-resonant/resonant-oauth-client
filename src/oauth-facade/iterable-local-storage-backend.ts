import { LocalStorageBackend, UnderlyingStorage } from '@openid/appauth';

export default class IterableLocalStorageBackend extends LocalStorageBackend implements AsyncIterable<[string, string]> {
  // The parent makes "storage" private, so redefine it to be available internally here
  protected storage: UnderlyingStorage;

  async* [Symbol.asyncIterator](): AsyncGenerator<[string, string]> {
    for (const key of Object.keys(this.storage)) {
      // eslint-disable-next-line no-await-in-loop
      const value = await this.getItem(key);
      if (value !== null) {
        yield [key, value];
      }
    }
  }
}

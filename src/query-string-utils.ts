import { BasicQueryStringUtils, LocationLike } from '@openid/appauth';

export default class NoHashQueryStringUtils extends BasicQueryStringUtils {
  parse(input: LocationLike, _useHash?: boolean) {
    // ignore useHash parameter, always use the query string instead
    return super.parse(input, false);
  }
}

import { BasicQueryStringUtils, LocationLike } from '@openid/appauth';

export default class NoHashQueryStringUtils extends BasicQueryStringUtils {
  parse(input: LocationLike, _useHash?: boolean) {
    // Even though it's not explicitly specified by a "response_mode=fragment" parameter, the
    // RedirectRequestHandler expects response parameter to be encoded in the fragment, instead
    // of the query string (which is the specification default).
    // See https://github.com/openid/AppAuth-JS/pull/167

    // Ignore useHash parameter, always use the query string instead
    return super.parse(input, false);
  }
}

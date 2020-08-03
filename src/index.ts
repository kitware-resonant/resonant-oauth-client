import {
  AuthorizationRequest,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  AuthorizationServiceConfigurationJson,
  FetchRequestor,
  AuthorizationNotifier,
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE,
  DefaultCrypto,
  RedirectRequestHandler,
  LocalStorageBackend,
  BasicQueryStringUtils,
  LocationLike,
} from "@openid/appauth/built/index";


class NoHashQueryStringUtils extends BasicQueryStringUtils {
  parse(input: LocationLike, useHash?: boolean) {
    // ignore useHash parameter, always use the query string instead
    return super.parse(input, false);
  }
}

export class IsicLogin {
  protected clientId: string;
  protected redirectUri: string;
  protected isicUri: string;
  protected config: AuthorizationServiceConfiguration;
  protected authHandler: RedirectRequestHandler;

  protected loginCallbacks: Array<Function>;

  constructor(clientId: string, redirectUri: string, isicUri = 'https://api.isic-archive.com') {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.isicUri = isicUri;
    console.log(this.isicUri);
    this.config = new AuthorizationServiceConfiguration({
      authorization_endpoint: `${this.isicUri}/o/authorize/`,
      token_endpoint: `${this.isicUri}/o/token/`,
      revocation_endpoint: '',
    });
    this.authHandler = new RedirectRequestHandler(new LocalStorageBackend(), new NoHashQueryStringUtils());



  const notifier = new AuthorizationNotifier();
  this.authHandler.setAuthorizationNotifier(notifier);

notifier.setAuthorizationListener((request, response, error) => {
});
  }

  startLogin() {
    const authRequest = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "identity",
      state: undefined,
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
    });
    this.authHandler.performAuthorizationRequest(this.config, authRequest);
  },

  onLogin(callback: (apiCredentials: object) => any) {
    this.loginCallbacks.push(callback);
  }
}

/*       authHandler.performAuthorizationRequest(config, authRequest);
import {BasicQueryStringUtils} from "@openid/appauth/built/query_string_utils";




  if (response) {
     var urlParams = new URLSearchParams(window.location.search);
      const tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
      const tokenRequest = new TokenRequest({
        client_id: "9XiMl6OV68cOuzXjTgBuHvolKdEtJBjdrVyfXHa5",
        redirect_uri: "http://localhost:8080",
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: response.code,
        refresh_token: undefined,
        extras: {
          code_verifier: request.internal['code_verifier'],
        }
      });

      tokenHandler.performTokenRequest(config, tokenRequest).then(function(r) {
        debugger;
        console.log(r);
      });
  }
});
authHandler.completeAuthorizationRequestIfPossible();
const config = 
      */

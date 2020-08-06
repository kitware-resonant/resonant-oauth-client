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

  constructor(
    clientId: string,
    redirectUri: string,
    isicUri = "https://api.isic-archive.com"
  ) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.isicUri = isicUri;
    console.log(this.isicUri);
    this.config = new AuthorizationServiceConfiguration({
      authorization_endpoint: `${this.isicUri}/o/authorize/`,
      token_endpoint: `${this.isicUri}/o/token/`,
      revocation_endpoint: "",
    });
    this.authHandler = new RedirectRequestHandler(
      new LocalStorageBackend(),
      new NoHashQueryStringUtils()
    );
  }

  startLogin() {
    const authRequest = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "identity",
      state: undefined,
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
    });
    authRequest.setupCodeVerifier();
    this.authHandler.performAuthorizationRequest(this.config, authRequest);
  }

  onLogin(callback: (apiCredentials: object) => any) {
    const notifier = new AuthorizationNotifier();
    this.authHandler.setAuthorizationNotifier(notifier);

    notifier.setAuthorizationListener((request, response, error) => {
      if (response) {
        const tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
        const tokenRequest = new TokenRequest({
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
          code: response.code,
          refresh_token: undefined,
          extras: {
            code_verifier: request.internal["code_verifier"],
          },
        });

        tokenHandler
          .performTokenRequest(this.config, tokenRequest)
          .then(function (r) {
            callback(r);
            // debugger;
            // console.log(r);
          });
      }
    });

    this.authHandler.completeAuthorizationRequestIfPossible();
  }
}

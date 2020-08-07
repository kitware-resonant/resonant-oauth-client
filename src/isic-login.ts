import {
  AuthorizationRequest,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  FetchRequestor,
  AuthorizationNotifier,
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE,
  LocalStorageBackend,
  TokenResponse,
} from '@openid/appauth';

import NoHashQueryStringUtils from './query-string-utils';
import ResolvingRedirectRequestHandler from './resolving-redirect-request-handler';

export default class IsicLogin {
  protected clientId: string;
  protected redirectUri: string;
  protected isicUri: string;
  protected config: AuthorizationServiceConfiguration;
  protected authHandler: ResolvingRedirectRequestHandler;

  constructor(clientId: string, redirectUri: string, isicUri = 'https://api.isic-archive.com') {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.isicUri = isicUri.replace(/\/$/, '');
    this.config = new AuthorizationServiceConfiguration({
      authorization_endpoint: `${this.isicUri}/o/authorize/`,
      token_endpoint: `${this.isicUri}/o/token/`,
      revocation_endpoint: '',
    });
    this.authHandler = new ResolvingRedirectRequestHandler(
      new LocalStorageBackend(),
      new NoHashQueryStringUtils()
    );
  }

  /**
   * Start the auth flow from an initial state.
   *
   * This will trigger a page redirect.
   */
  async startLogin() {
    const authRequest = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'identity',
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
    });
    await authRequest.setupCodeVerifier();
    this.authHandler.performAuthorizationRequest(this.config, authRequest);
  }

  /**
   * Finish the auth flow.
   *
   * This will return a Promise, which will resolve with the auth token if the page is in a valid
   * post-login state. Otherwise, the Promise will reject.
   */
  async finishLogin(): Promise<TokenResponse> {
    const notifier = new AuthorizationNotifier();
    this.authHandler.setAuthorizationNotifier(notifier);

    // Fetch a valid auth response (or throw)
    const authRequestResponse = await this.authHandler.resolveAuthorizationRequest();

    // Exchange for a token
    const tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
    const tokenRequest = new TokenRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
      code: authRequestResponse.response.code,
      extras: {
        code_verifier: authRequestResponse.request.internal!.code_verifier,
      },
    });

    // Return tokenResponse
    return tokenHandler.performTokenRequest(this.config, tokenRequest);
  }
}

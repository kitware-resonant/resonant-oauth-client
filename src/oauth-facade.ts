import {
  AuthorizationNotifier,
  AuthorizationRequest,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  FetchRequestor,
  GRANT_TYPE_AUTHORIZATION_CODE,
  LocalStorageBackend,
  RevokeTokenRequest,
  TokenRequest,
  TokenResponse,
} from '@openid/appauth';

import NoHashQueryStringUtils from './query-string-utils';
import ResolvingRedirectRequestHandler from './resolving-redirect-request-handler';
import {TokenRequestHandler} from "@openid/appauth/src/token_request_handler";

export { TokenResponse };

/**
 * A stateless manager for OAuth server interaction.
 *
 * This wraps some messy details of low-level library usage.
 */
export default class OauthFacade {
  protected readonly authorizationServerBaseUrl: string;
  protected readonly config: AuthorizationServiceConfiguration;
  protected readonly authHandler: ResolvingRedirectRequestHandler = new ResolvingRedirectRequestHandler(
    new LocalStorageBackend(),
    new NoHashQueryStringUtils(),
  );
  protected readonly tokenHandler: TokenRequestHandler = new BaseTokenRequestHandler(
    new FetchRequestor(),
  );

  /**
   * Create an OauthFacade.
   *
   * @param authorizationServerBaseUrl The common base URL for Authorization Server endpoints.
   * @param redirectUrl The URL of the current page, to be redirected back to after authorization.
   * @param clientId The Client ID for this application.
   * @param scopes An array of scopes to request access to.
   */
  constructor(
    authorizationServerBaseUrl: string,
    protected readonly redirectUrl: string,
    protected readonly clientId: string,
    protected readonly scopes: Array<string>,
  ) {
    // Strip any trailing slash
    this.authorizationServerBaseUrl = authorizationServerBaseUrl
      .replace(/\/$/, '');
    this.config = new AuthorizationServiceConfiguration({
      authorization_endpoint: this.authorizationEndpoint,
      token_endpoint: this.tokenEndpoint,
      revocation_endpoint: this.revocationEndpoint,
    });
  }

  protected get authorizationEndpoint(): string {
    return `${this.authorizationServerBaseUrl}/authorize/`;
  }

  protected get tokenEndpoint(): string {
    return `${this.authorizationServerBaseUrl}/token/`;
  }

  protected get revocationEndpoint(): string {
    return `${this.authorizationServerBaseUrl}/revoke_token/`;
  }

  /**
   * Start the Authorization Code flow, redirecting to the Authorization Server.
   *
   * This will trigger a page redirect.
   */
  public async startLogin(): Promise<void> {
    const authRequest = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
      scope: this.scopes.join(' '),
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
      extras: {
        response_mode: 'query',
      },
    });
    await authRequest.setupCodeVerifier();
    this.authHandler.performAuthorizationRequest(this.config, authRequest);
  }

  /**
   * Finish the Authorization Code flow, following a return from the Authorization Server.
   *
   * This will return a Promise, which will resolve with the access token if the page is in a valid
   * post-login state. Otherwise, the Promise will reject.
   */
  public async finishLogin(): Promise<TokenResponse> {
    const notifier = new AuthorizationNotifier();
    this.authHandler.setAuthorizationNotifier(notifier);

    // Fetch a valid auth response (or throw)
    const authRequestResponse = await this.authHandler.resolveAuthorizationRequest();

    // Exchange for an access token and return tokenResponse
    const tokenRequest = new TokenRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
      grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
      code: authRequestResponse.response.code,
      extras: {
        code_verifier: authRequestResponse.request.internal!.code_verifier,
      },
    });
    return this.tokenHandler.performTokenRequest(this.config, tokenRequest);
  }

  /**
   * Revoke an Access Token from the Authorization Server.
   *
   * This will return a Promise, which will resolve when the operation successfully completes.
   * In case of an error, the Promise will reject.
   */
  public async logout(token: TokenResponse): Promise<void> {
    const revokeTokenRequest = new RevokeTokenRequest({
      token: token.accessToken,
      token_type_hint: 'access_token',
      client_id: this.clientId,
    });
    await this.tokenHandler.performRevokeTokenRequest(this.config, revokeTokenRequest);
  }
}

import {
  AppAuthError,
  AuthorizationRequest,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
  LocalStorageBackend,
  RevokeTokenRequest,
  setFlag,
  TokenError,
  TokenRequest,
  type TokenRequestHandler,
  type TokenResponse,
} from '@openid/appauth';
import { ServerError, TokenFailureError } from './error.js';
import NoHashQueryStringUtils from './no-hash-query-string-utils.js';
import OauthFetchRequestor from './oauth-fetch-requestor.js';
import ResolvingRedirectRequestHandler from './resolving-redirect-request-handler.js';

export { TokenResponse, type TokenResponseJson } from '@openid/appauth';
export * from './error.js';

// Disable console logging from @openid/appauth
setFlag('IS_LOG', false);

/**
 * A stateless manager for OAuth server interaction.
 *
 * This wraps some messy details of low-level library usage.
 */
export default class OauthFacade {
  protected readonly config: AuthorizationServiceConfiguration;

  protected readonly authHandler = new ResolvingRedirectRequestHandler(
    new LocalStorageBackend(),
    new NoHashQueryStringUtils(),
  );

  protected readonly tokenHandler: TokenRequestHandler = new BaseTokenRequestHandler(
    new OauthFetchRequestor(),
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
    protected readonly authorizationServerBaseUrl: URL,
    protected readonly redirectUrl: URL,
    protected readonly clientId: string,
    protected readonly scopes: string[],
  ) {
    this.config = new AuthorizationServiceConfiguration({
      // biome-ignore-start lint/style/useNamingConvention: library interface names
      authorization_endpoint: this.authorizationEndpoint.toString(),
      token_endpoint: this.tokenEndpoint.toString(),
      revocation_endpoint: this.revocationEndpoint.toString(),
      // biome-ignore-end lint/style/useNamingConvention: library interface names
    });
  }

  protected get authorizationEndpoint(): URL {
    return new URL('authorize/', this.authorizationServerBaseUrl);
  }

  protected get tokenEndpoint(): URL {
    return new URL('token/', this.authorizationServerBaseUrl);
  }

  protected get revocationEndpoint(): URL {
    return new URL('revoke_token/', this.authorizationServerBaseUrl);
  }

  /**
   * Start the Authorization Code flow, redirecting to the Authorization Server.
   *
   * This will trigger a page redirect.
   */
  public async startLogin(): Promise<void> {
    const authRequest = new AuthorizationRequest({
      // biome-ignore-start lint/style/useNamingConvention: library interface names
      client_id: this.clientId,
      redirect_uri: this.redirectUrl.toString(),
      scope: this.scopes.join(' '),
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
      extras: {
        response_mode: 'query',
      },
      // biome-ignore-end lint/style/useNamingConvention: library interface names
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
    // Fetch a valid auth response (or throw)
    const authRequestResponse = await this.authHandler.resolveAuthorizationRequest();

    // Exchange for an access token and return tokenResponse
    const tokenRequest = new TokenRequest({
      // biome-ignore-start lint/style/useNamingConvention: library interface names
      client_id: this.clientId,
      redirect_uri: this.redirectUrl.toString(),
      grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
      code: authRequestResponse.response.code,
      extras: {
        // biome-ignore lint/style/noNonNullAssertion: ".internal.code_verifier" is always set
        code_verifier: authRequestResponse.request.internal!.code_verifier,
      },
      // biome-ignore-end lint/style/useNamingConvention: library interface names
    });

    try {
      // await is necessary here, to ensure errors are caught before returning
      return await this.tokenHandler.performTokenRequest(this.config, tokenRequest);
    } catch (error) {
      // Based on the implementation of performTokenRequest, the error should at least be an
      // AppAuthError, but this cannot be structurally guaranteed
      if (error instanceof AppAuthError) {
        if (error.extras instanceof TokenError) {
          // The server returned a well-formed OAuth2 error
          throw new TokenFailureError(
            error.extras.error,
            error.extras.errorDescription,
            error.extras.errorUri ? new URL(error.extras.errorUri) : undefined,
            { cause: error },
          );
        }
        // The server or connection failed in some way
        throw new ServerError(error.message, { cause: error });
      }
      // This should never happen
      /* v8 ignore next 2 */
      throw new Error('Internal error');
    }
  }

  public async refresh(token: TokenResponse): Promise<TokenResponse> {
    const tokenRequest = new TokenRequest({
      // biome-ignore-start lint/style/useNamingConvention: library interface names
      client_id: this.clientId,
      redirect_uri: this.redirectUrl.toString(),
      grant_type: GRANT_TYPE_REFRESH_TOKEN,
      refresh_token: token.refreshToken,
      // Don't specify a new scope, which will implicitly request the same scope as the old token
      // biome-ignore-end lint/style/useNamingConvention: library interface names
    });
    // Return the new token
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
      // biome-ignore-start lint/style/useNamingConvention: library interface names
      token: token.accessToken,
      token_type_hint: 'access_token',
      client_id: this.clientId,
      // biome-ignore-end lint/style/useNamingConvention: library interface names
    });
    try {
      await this.tokenHandler.performRevokeTokenRequest(this.config, revokeTokenRequest);
    } catch (error) {
      // RFC 7009 defines token revocation errors, but performRevokeTokenRequest doesn't attempt
      // to look for them and doesn't return the response itself.
      // TODO: Token revocation errors should be detected and a LogoutFailureError thrown.

      // Based on the implementation of performRevokeTokenRequest, the error should at least be an
      // AppAuthError, but this cannot be structurally guaranteed
      if (error instanceof AppAuthError) {
        // The server or connection failed in some way, only these are thrown.
        throw new ServerError(error.message, { cause: error });
      }
      // This should never happen
      /* v8 ignore next 2 */
      throw new Error('Internal error');
    }
  }

  /**
   * Determine whether a given token is expired.
   */
  public static tokenIsExpired(token: TokenResponse): boolean {
    if (token.expiresIn !== undefined) {
      // Token has a known expiration
      const expirationDate = new Date((token.issuedAt + token.expiresIn) * 1000);
      const currentDate = new Date();
      if (expirationDate <= currentDate) {
        return true;
      }
    }
    // Not expired, or unknowable.
    return false;
  }
}

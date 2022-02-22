import OauthFacade, { TokenResponse } from './oauth-facade';

export interface Headers {
  [name: string]: string;
}

export interface OauthClientOptions {
  redirectUri?: string;
}

export default class OauthClient {
  protected readonly authorizationServerBaseUrl: string;

  protected token: TokenResponse | null = null;

  protected readonly oauthFacade: OauthFacade;

  constructor(
    authorizationServerBaseUrl: string,
    protected readonly clientId: string,
    scopes: string[] = [],
    options: OauthClientOptions = {},
  ) {
    if (!window.isSecureContext) {
      throw Error('OAuth Client cannot operate within insecure contexts.');
    }
    // Strip any trailing slash
    this.authorizationServerBaseUrl = authorizationServerBaseUrl
      .replace(/\/$/, '');

    this.oauthFacade = new OauthFacade(
      this.authorizationServerBaseUrl,
      options.redirectUri || `${window.location.origin}${window.location.pathname}`,
      this.clientId,
      scopes,
    );
  }

  public get isLoggedIn(): boolean {
    return this.token !== null;
  }

  public async redirectToLogin(): Promise<void> {
    await this.oauthFacade.startLogin();
  }

  public async maybeRestoreLogin(): Promise<void> {
    // Returning from an Authorization flow should trump any other source of token recovery.
    try {
      this.token = await this.oauthFacade.finishLogin();
    } catch {
      // Most likely, there is no pending Authorization flow.
      // Possibly, there is an Authorization failure, which will be emitted to the
      // console, but doesn't need to be fatal, since this can just proceed with no token.
    }
    // Regardless of the outcome, remove any Authorization parameters, since the flow is now
    // concluded.
    this.removeUrlParameters();

    if (!this.token) {
      // Try restoring from a locally saved token.
      this.loadToken();
    }

    if (this.token && OauthFacade.tokenIsExpired(this.token)) {
      // Need to refresh
      try {
        this.token = await this.oauthFacade.refresh(this.token);
      } catch (error) {
        console.error(`Error refreshing token: ${error}`);
        this.token = null;
      }
    }

    // Store the token value (which might be null).
    this.storeToken();
  }

  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.oauthFacade.logout(this.token);
      } catch (error) {
        console.error(`Error logging out token: ${error}`);
      }
    }

    // As a guard against stateful weirdness, always to clear the token.
    this.token = null;
    this.storeToken();
  }

  public get authHeaders(): Headers {
    const headers: Headers = {};
    if (this.token) {
      headers.Authorization = `${this.token.tokenType} ${this.token.accessToken}`;
    }
    return headers;
  }

  protected get tokenStorageKey(): string {
    return `oauth-token-${this.clientId}`;
  }

  protected loadToken(): void {
    const serializedToken = window.localStorage.getItem(this.tokenStorageKey);
    this.token = serializedToken ? new TokenResponse(JSON.parse(serializedToken)) : null;
  }

  protected storeToken(): void {
    if (!this.token) {
      window.localStorage.removeItem(this.tokenStorageKey);
    } else {
      const serializedToken = JSON.stringify(this.token.toJson());
      window.localStorage.setItem(this.tokenStorageKey, serializedToken);
    }
  }

  /**
   * Remove Authorization Response parameters from the URL query string.
   */
  // eslint-disable-next-line class-methods-use-this
  protected removeUrlParameters(): void {
    const currentUri = window.location.toString();

    const url = new URL(currentUri);
    // Possible parameters in an Authorization Response
    [
      'code',
      'state',
      'error',
      'error_description',
      'error_uri',
    ].forEach((oauthParam) => {
      url.searchParams.delete(oauthParam);
    });
    const newUri = url.toString();

    if (currentUri !== newUri) {
      window.history.replaceState(null, '', newUri);
    }
  }
}

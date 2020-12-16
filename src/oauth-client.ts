import {TokenResponse} from '@openid/appauth';

import OauthFacade from './oauth-facade';

export interface Headers {
  [key: string]: string;
}

export default class OauthClient {
  protected readonly authorizationServerBaseUrl: string;
  protected token: TokenResponse|null = null;
  protected readonly oauthFacade: OauthFacade;

  constructor(
    authorizationServerBaseUrl: string,
    protected readonly clientId: string,
    scopes: Array<string> = [],
  ) {
    if (!window.isSecureContext) {
      throw Error('OAuth Client cannot operate within insecure contexts.')
    }
    // Strip any trailing slash
    this.authorizationServerBaseUrl = authorizationServerBaseUrl.replace(/\/$/, '');

    const currentUri = `${window.location.origin}${window.location.pathname}`;
    this.oauthFacade = new OauthFacade(this.authorizationServerBaseUrl, currentUri, this.clientId, scopes);
  }

  public get isLoggedIn(): boolean {
    return this.token !== null;
  }

  public async redirectToLogin(): Promise<void> {
    await this.oauthFacade.startLogin();
  }

  public async maybeRestoreLogin(): Promise<void> {
    // Load from saved state, after a page refresh
    const token = this.loadToken();
    if (token) {
      this.token = token;
      return;
    }

    // Return from login flow
    try {
      this.token = await this.oauthFacade.finishLogin()
    } catch (error) {
      // Anonymous
      return;
    }
    // Finalize return from login flow
    this.storeToken(this.token);
    this.removeQueryString();
  }

  public async logout(): Promise<void> {
    // As a guard against stateful weirdness, always attempt to clear the token from localStorage
    this.storeToken(null);
    if (this.token) {
      await this.oauthFacade.logout(this.token);
      this.token = null;
    }
  }

  public get authHeaders(): Headers  {
    const headers: Headers = {};
    if (this.token) {
      headers['Authorization'] = `${this.token.tokenType} ${this.token.accessToken}`;
    }
    return headers;
  }

  protected get tokenStorageKey(): string {
    return `oauth-token-${this.clientId}`;
  }

  protected loadToken(): TokenResponse|null {
    const serializedToken = window.localStorage.getItem(this.tokenStorageKey);
    if (serializedToken) {
      return new TokenResponse(JSON.parse(serializedToken));
    } else {
      return null;
    }
  }

  protected storeToken(token: TokenResponse|null) {
    if (!token) {
      window.localStorage.removeItem(this.tokenStorageKey);
    } else {
      const serializedToken = JSON.stringify(token.toJson());
      window.localStorage.setItem(this.tokenStorageKey, serializedToken);
    }
  }

  protected removeQueryString(): void {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

import {TokenResponse} from '@openid/appauth';

import IsicLogin from './isic-login';


export default class IsicClient {
  protected isicUri: string;
  protected token: TokenResponse|null;
  protected isicLogin: IsicLogin;

  get isLoggedIn() {
    return this.token !== null;
  }

  async redirectToLogin() {
    await this.isicLogin.startLogin();
  }

  async logout() {
    await this.storeToken(null);
  }

  constructor(
    clientId: string,
    isicUri = 'https://api.isic-archive.com'
  ) {
    if (!window.isSecureContext) {
      throw Error('ISIC Client cannot operate within insecure contexts.')
    }

    this.isicUri = isicUri.replace(/\/$/, '');
    this.token = null;

    const currentUri = `${window.location.origin}${window.location.pathname}`;
    this.isicLogin = new IsicLogin(clientId, currentUri, this.isicUri);
  }

  async maybeRestoreLogin() {
    // Load from saved state, after a page refresh
    const token = await this.loadToken();
    if (token) {
      this.token = token;
      return;
    }

    // Return from login flow
    try {
      this.token = await this.isicLogin.finishLogin()
    } catch (error) {
      // Anonymous
      return;
    }
    // Finalize return from login flow
    await this.storeToken(this.token);
    this.removeQueryString();
  }

  protected loadToken(): TokenResponse|null {
    const serializedToken = window.localStorage.getItem('isic-token');
    if (serializedToken) {
      return new TokenResponse(JSON.parse(serializedToken));
    } else {
      return null;
    }
  }

  protected storeToken(token: TokenResponse|null) {
    if (!token) {
      window.localStorage.removeItem('isic-token');
    } else {
      const serializedToken = JSON.stringify(token.toJson());
      window.localStorage.setItem('isic-token', serializedToken);
    }
  }

  protected removeQueryString() {
    window.history.replaceState(null, '', window.location.pathname)
  }

  protected get headers() {
    const headers = new Headers();
    if (this.token) {
      headers.append('Authorization', `${this.token.tokenType} ${this.token.accessToken}`);
    }
    return headers;
  }

  protected get fetchOptions(): RequestInit {
    return {
      headers: this.headers,
      mode: 'cors',
      credentials: 'omit',
    }
  }

  async fetchJson(endpoint: string, method='GET') {
    const canonicalEndpoint = endpoint
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .concat('/');
    const resp = await fetch(`${this.isicUri}/${canonicalEndpoint}`, {
      ...this.fetchOptions,
      method,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Request error: ${resp.status}: ${text}`)
    }
    return resp.json();
  }

  async getLegacyToken() {
    return this.fetchJson(`api/v1/token/legacy`, 'POST');
  }
}

import OAuth2Server, {
  type AuthorizationCode,
  type Client,
  type RefreshToken,
  type Token,
} from '@node-oauth/oauth2-server';

const authCodeDb = new Map<string, AuthorizationCode>();
const accessTokenDb = new Map<string, Token>();
const refreshTokenDb = new Map<string, RefreshToken>();

export const registeredClients: Client[] = [
  {
    id: 'resonant-client-id',
    redirectUris: ['http://www.example.com/'],
    grants: ['authorization_code', 'refresh_token'],
  },
];
export const registeredScopes = ['read', 'write'];

export const model: OAuth2Server.AuthorizationCodeModel | OAuth2Server.RefreshTokenModel = {
  async getClient(clientId) {
    for (const client of registeredClients) {
      if (client.id === clientId) {
        return client;
      }
    }
    return false;
  },
  async validateScope(_user, _client, scope) {
    // Interpret undefined as empty set of scopes, but don't return undefined,
    // as it is considered falsy and will fail validation
    const requestedScopes = scope ?? [];
    return requestedScopes.every((requestedScope) => registeredScopes.includes(requestedScope))
      ? requestedScopes
      : false;
  },
  async getAuthorizationCode(authorizationCode) {
    return authCodeDb.get(authorizationCode);
  },
  async saveAuthorizationCode(token, client, user) {
    const authorizationCode = { ...token, client, user };
    authCodeDb.set(authorizationCode.authorizationCode, authorizationCode);
    return authorizationCode;
  },
  async revokeAuthorizationCode(code) {
    return authCodeDb.delete(code.authorizationCode);
  },
  async saveToken(token, client, user) {
    const savedToken: Token = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      client,
      user,
    };
    accessTokenDb.set(savedToken.accessToken, savedToken);

    if (savedToken.refreshToken) {
      // Clone "savedToken" to "refreshToken", but omit some properties
      const refreshToken: RefreshToken = {
        refreshToken: savedToken.refreshToken,
        refreshTokenExpiresAt: savedToken.refreshTokenExpiresAt,
        scope: savedToken.scope,
        client,
        user,
      };
      refreshTokenDb.set(refreshToken.refreshToken, refreshToken);
    }
    return savedToken;
  },
  async getAccessToken(accessToken) {
    return accessTokenDb.get(accessToken);
  },
  async getRefreshToken(refreshToken) {
    return refreshTokenDb.get(refreshToken);
  },
  async revokeToken(token) {
    return refreshTokenDb.delete(token.refreshToken);
  },
};

export default new OAuth2Server({ model, requirePKCE: true });

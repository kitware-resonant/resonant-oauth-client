export abstract class OAuthFacadeError extends Error {}

export class NoAuthInProgressError extends OAuthFacadeError {
  constructor() {
    super('No authorization flow in progress.');
  }
}

export class ServerError extends OAuthFacadeError {
  constructor(message: string, options?: ErrorOptions) {
    super(`Server error: ${message}.`, options);
  }
}

export abstract class OAuthFailureError extends OAuthFacadeError {
  constructor(
    public readonly errorCode: string,
    public readonly errorDescription: string | null = null,
    public readonly errorUri: URL | null = null,
    options?: ErrorOptions,
  ) {
    const message = `OAuth2 error: ${errorCode}${errorDescription ? `: ${errorDescription}` : ''}.`;
    super(message, options);
  }
}

export class AuthorizationFailureError extends OAuthFailureError {}

export class TokenFailureError extends OAuthFailureError {}

export class LogoutFailureError extends OAuthFailureError {}

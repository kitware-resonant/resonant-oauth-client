import { AuthorizationResponse, RedirectRequestHandler } from '@openid/appauth';
import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';

export interface SuccessfulAuthorizationRequestResponse {
  request: AuthorizationRequest;
  response: AuthorizationResponse;
}

export default class ResolvingRedirectRequestHandler extends RedirectRequestHandler {
  /**
   * Return a Promise, guaranteed to always resolve with valid AuthorizationRequest and
   * AuthorizationResponse data, or reject.
   *
   * This fulfills the same role as completeAuthorizationRequestIfPossible, but returns data
   * via a Promise instead of a callback and provides additional error handling.
   */
  async resolveAuthorizationRequest(): Promise<SuccessfulAuthorizationRequestResponse> {
    const authorizationRequestResponse = await this.completeAuthorizationRequest();
    if (!authorizationRequestResponse) {
      // This is potentially a normal case of no auth flow, but could be an error with
      // mismatched internal and URL-returned state
      throw new Error('Authorization incomplete.');
    }

    const { response } = authorizationRequestResponse;
    if (!response) {
      // Based on the implementation of completeAuthorizationRequest, the error is
      // typically available at this point, but it cannot be structurally guaranteed
      const errorDescription = authorizationRequestResponse.error?.errorDescription ?? 'unknown';
      throw new Error(`Authorization error: ${errorDescription}.`);
    }

    const { request } = authorizationRequestResponse;

    return {
      request,
      response,
    };
  }
}

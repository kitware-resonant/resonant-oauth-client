import { type AuthorizationResponse, RedirectRequestHandler } from '@openid/appauth';
import type { AuthorizationRequest } from '@openid/appauth/built/authorization_request';

export type SuccessfulAuthorizationRequestResponse = {
  request: AuthorizationRequest;
  response: AuthorizationResponse;
};

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
      const errorCode = authorizationRequestResponse.error?.error;
      const errorDescription = authorizationRequestResponse.error?.errorDescription;

      // This is an explicit server-provided error, so log it
      const error = new Error(`Authorization error: ${errorCode}${errorDescription ? `: ${errorDescription}` : ''}.`);
      console.error(error);
      throw error;
    }

    const { request } = authorizationRequestResponse;

    return {
      request,
      response,
    };
  }
}

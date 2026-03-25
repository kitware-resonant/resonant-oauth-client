import OAuth2Server from '@node-oauth/oauth2-server';
import {
  type DefaultBodyType,
  HttpResponse,
  http,
  type JsonBodyType,
  type StrictRequest,
} from 'msw';
import { setupServer } from 'msw/node';

import oauth from './oauth2.js';

async function mswRequestToOauth(
  request: StrictRequest<DefaultBodyType>,
): Promise<OAuth2Server.Request> {
  const headers = {
    ...Object.fromEntries(request.headers),
    // TODO: MSW is failing to add Content-Length headers, so the internals of
    //  "@node-oauth/oauth2-server" are refusing to allow POST bodies;
    //  See: https://github.com/mswjs/msw/issues/2674
    'Content-Length': (await request.clone().text()).length.toString(),
  };

  // `OAuth2Server.Request` expects body as a decoded basic object and doesn't support an encoded
  // string (from `request.text()`) or a `FormData` (from `request.formData()`).
  const body =
    request.headers.get('Content-Type') === 'application/x-www-form-urlencoded'
      ? Object.fromEntries(await request.formData())
      : {};

  return new OAuth2Server.Request({
    body,
    headers,
    method: request.method,
    query: Object.fromEntries(new URL(request.url).searchParams),
  });
}

function oauthResponseToMsw(oauthResponse: OAuth2Server.Response): HttpResponse<JsonBodyType> {
  return HttpResponse.json(oauthResponse.body, {
    status: oauthResponse.status,
    headers: oauthResponse.headers,
  });
}

export default setupServer(
  // Define a route for the test URL, so navigations to load it don't trigger unknown route errors
  http.get('http://www.example.com/', () => new HttpResponse()),
  http.get('https://api.example.com/authorize/', async ({ request }) => {
    const oauthRequest = await mswRequestToOauth(request);
    const oauthResponse = new OAuth2Server.Response();
    try {
      await oauth.authorize(oauthRequest, oauthResponse, {
        authenticateHandler: {
          handle() {
            // Always assume the user is logged in with the authorization server.
            // Return a trivial user object.
            return {};
          },
        },
      });
    } catch (error) {
      // Failed attempts will throw errors, but oauthResponse should be updated with the error code,
      // with is a redirect for authorization
      if (oauthResponse.status !== 302) {
        // Under some circumstances, the oauthResponse will not be updated.
        // Ideally, a redirect with the error code in the query string should be set, but
        // just make this an internal error.
        oauthResponse.status = 500;
        if (error instanceof Error) {
          oauthResponse.body = error.message;
        }
      }
    }
    return oauthResponseToMsw(oauthResponse);
  }),

  http.post('https://api.example.com/token/', async ({ request }) => {
    const oauthRequest = await mswRequestToOauth(request);
    const oauthResponse = new OAuth2Server.Response();
    try {
      await oauth.token(oauthRequest, oauthResponse);
    } catch (error) {
      // Failed attempts will throw errors, but oauthResponse should be updated with the error code,
      // which is 400 for tokens
      if (oauthResponse.status !== 400) {
        oauthResponse.status = 500;
        if (error instanceof Error) {
          oauthResponse.body = error.message;
        }
      }
    }
    return oauthResponseToMsw(oauthResponse);
  }),

  http.post('https://api.example.com/revoke_token/', async () => {
    // The oauth2-server library doesn't implement revoking an "access_token".
    // Revoking a "refresh_token" is implemented internally, but not via a distinctly callable
    // mechanism. See RFC7009 for more information about token revocation.
    // TODO: Revoke the access token manually.

    // RFC 7009 states that this has no body and some servers send a non-JSON content type.
    return new HttpResponse('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }),
);

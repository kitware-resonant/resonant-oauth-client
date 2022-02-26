# girder-oauth-client
[![npm (scoped)](https://img.shields.io/npm/v/@girder/oauth-client)](https://www.npmjs.com/package/@girder/oauth-client)

A TypeScript library for performing OAuth login to a Girder 4 (Django) server.

## Description
This provides support for authenticating with Girder 4 servers,
using the OAuth2.0 Authorization Code Grant with PKCE flow.

## Usage
* Install the library:
  ```bash
  yarn add @girder/oauth-client
  ```

  or if you're using npm:
  ```bash
  npm install @girder/oauth-client
  ```

* Instantiate an `OauthClient` with your application-specific configuration:
  ```js
  import OauthClient from '@girder/oauth-client';

  const oauthClient = new OauthClient(
    new URL(process.env.OAUTH_API_ROOT), // e.g. 'http://localhost:8000/oauth/'
    process.env.OAUTH_CLIENT_ID, // e.g. 'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A'
  );
  ```

* Call `redirectToLogin` when it's time to start a login flow:
  ```js
  document.querySelector('#sign-in-link').addEventListener('click', (event) => {
    event.preventDefault();
    oauthClient.redirectToLogin();
    // This will redirect away from the current page
  });
  ```

* At the start of *every* page load, unconditionally call `maybeRestoreLogin`, to attempt to
  restore a login state; this will no-op if no login is present. Afterwards, get and store HTTP
  headers for authentication from `authHeaders`.
  ```js
  let authHeaders;
  oauthClient.maybeRestoreLogin()
    .then(() => {
      authHeaders = oauthClient.authHeaders;
    });
  ```

  or, if using ES6 and `async`/`await`:
  ```js
  await oauthClient.maybeRestoreLogin();
  let { authHeaders } = client;
  ```

* Include these headers with every Ajax API request:
  ```js
  fetch('http://localhost:8000/api/files', {
    headers: authHeaders,
  });
  ```

* The login state will persist across page refreshes. Call `logout` to clear any active login:
  ```js
  document.querySelector('#sign-out-link').addEventListener('click', (event) => {
    event.preventDefault();
    oauthClient.logout()
      .then(() => {
        authHeaders = oauthClient.authHeaders;
      });
  });
  ```

## Example app
This repository comes bundled with an [example application](example/index.html). Run it with:
```bash
git clone https://github.com/girder/girder-oauth-client.git
yarn install
yarn build
cd example
yarn install
yarn serve
# Visit http://localhost:1234/
```

## Development
To develop the library using the example app:
```bash
# From the root of the repository
yarn link
yarn install
yarn watch
```
In another terminal:
```bash
# From the root of the repository
cd example
yarn link '@girder/oauth-client'
yarn install
yarn serve
```

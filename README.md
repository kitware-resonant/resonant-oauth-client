# ISIC Client

A client library for authenticating with the ISIC Archive from a SPA (single page application).

[![npm (scoped)](https://img.shields.io/npm/v/@isic/client)](https://www.npmjs.com/package/@isic/client)


## Description

The ISIC client provides support for authenticating with the ISIC Archive using the Auth Code with PKCE flow of OAuth2.0.

## Usage

```bash
$ npm install @isic/client

```

or if you're using yarn:
```bash
$ yarn add @isic/client
```

```js
// create an isic client
// when running the app pass the CLIENT_ID as an environment var
const client = new IsicClient(process.env.CLIENT_ID);
```

```js
// handle the client signing in
document.querySelector('#sign-in-link').addEventListener('click', (event) => {
    event.preventDefault();
    client.redirectToLogin();
});
```

```js
// load the proper token on each page load
let legacyToken;
client.maybeRestoreLogin()
  .then(() => {
    if (client.isLoggedIn) {
      return client.getLegacyToken();
    } else {
      return null;
    }
  })
  .then((_legacyToken) => {
    legacyToken = _legacyToken;
  })
```

```js
// handle the client signing out
document.querySelector('#sign-out-link').addEventListener('click', (event) => {
    event.preventDefault();
    client.logout();
});
```

## Example app

This repository comes bundled with an [example application](example/index.html). 

```bash
$ git clone git@github.com:ImageMarkup/isic-client.git
$ cd example
$ yarn install
$ yarn serve

# visit http://localhost:1234/
```



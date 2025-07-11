import OauthClient from '@resonant/oauth-client';

// Will be initialized asynchronously in the DOMContentLoaded event
// TODO: should we have a seperate example app for initializing using
// well-known URL?
let oauthClient;

function updateDom() {
  document.querySelector('#sign-in-link').style.visibility = oauthClient.isLoggedIn
    ? 'hidden'
    : 'visible';
  document.querySelector('#sign-out-link').style.visibility = oauthClient.isLoggedIn
    ? 'visible'
    : 'hidden';

  document.querySelector('#logged-in').innerHTML = JSON.stringify(oauthClient.isLoggedIn);
  document.querySelector('#auth-headers').innerHTML = JSON.stringify(oauthClient.authHeaders);
}

document.querySelector('#sign-in-link').addEventListener('click', async (event) => {
  event.preventDefault();
  await oauthClient.redirectToLogin();
});
document.querySelector('#sign-out-link').addEventListener('click', async (event) => {
  event.preventDefault();
  await oauthClient.logout();
  updateDom();
});

document.addEventListener('DOMContentLoaded', async () => {
  oauthClient = await OauthClient.fromWellKnownUrl(
    new URL('http://localhost:8000/oauth/'),
    'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A',
    ['openid'],
  );
  updateDom();
  await oauthClient.maybeRestoreLogin();
  updateDom();
});

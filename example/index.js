import OauthClient from '@resonant/oauth-client';

const oauthClient = new OauthClient(
  new URL('http://localhost:8000/oauth/'),
  'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A',
);

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
  updateDom();
  await oauthClient.maybeRestoreLogin();
  updateDom();
});

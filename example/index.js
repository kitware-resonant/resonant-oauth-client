import OauthClient from '@girder/oauth-client';

const client = new OauthClient(
  'http://localhost:8000/oauth/',
  'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A',
  [],
);

document.querySelector('#sign-in-link')
  .addEventListener('click', (event) => {
    event.preventDefault();
    client.redirectToLogin();
  });
document.querySelector('#sign-out-link')
  .addEventListener('click', (event) => {
    event.preventDefault();
    client.logout();
    window.location.reload();
  });

client.maybeRestoreLogin()
  .then(() => {
    document.querySelector('#logged-in').innerHTML = JSON.stringify(client.isLoggedIn);
    document.querySelector('#auth-headers').innerHTML = JSON.stringify(client.authHeaders);
  });

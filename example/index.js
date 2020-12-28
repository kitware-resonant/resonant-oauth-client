import OauthClient from '@girder/oauth-client';

const oauthClient = new OauthClient(
  'http://localhost:8000/oauth/',
  'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A',
);

function updateDom() {
  document.querySelector('#sign-in-link').style.visibility =
    oauthClient.isLoggedIn ? 'hidden' : 'visible';
  document.querySelector('#sign-out-link').style.visibility =
    oauthClient.isLoggedIn ? 'visible' : 'hidden';

  document.querySelector('#logged-in').innerHTML =
    JSON.stringify(oauthClient.isLoggedIn);
  document.querySelector('#auth-headers').innerHTML =
    JSON.stringify(oauthClient.authHeaders);
}

document.querySelector('#sign-in-link')
  .addEventListener('click', (event) => {
    event.preventDefault();
    oauthClient.redirectToLogin();
  });
document.querySelector('#sign-out-link')
  .addEventListener('click', (event) => {
    event.preventDefault();
    oauthClient.logout()
      .then(updateDom);
  });

updateDom();

oauthClient.maybeRestoreLogin()
  .then(updateDom);

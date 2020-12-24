import OauthClient from '@girder/oauth-client';

const oauthClient = new OauthClient(
  'http://localhost:8000/oauth/',
  'Qir0Aq7AKIsAkMDLQe9MEfORbHEBKsViNhAKJf1A',
);

function updateDom() {
  document.querySelector('#logged-in').innerHTML = JSON.stringify(oauthClient.isLoggedIn);
  document.querySelector('#auth-headers').innerHTML = JSON.stringify(oauthClient.authHeaders);

  const visibleButtonSelector = oauthClient.isLoggedIn ? '#sign-out-link' : '#sign-in-link';
  document.querySelector(visibleButtonSelector).style.visibility = 'visible';
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

oauthClient.maybeRestoreLogin()
  .then(updateDom);

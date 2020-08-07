import IsicClient from '@isic/login';

const client = new IsicClient(
  'v1odYySCetBht6DT9svQdAkvmVXrRHOwIIGNk6JG',
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
  .then(() => {
    document.querySelector('#legacy-token').innerHTML = JSON.stringify(legacyToken);
  });

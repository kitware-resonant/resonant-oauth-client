import { IsicLogin } from '../../dist/index.js';

const isicLogin = new IsicLogin('9XiMl6OV68cOuzXjTgBuHvolKdEtJBjdrVyfXHa5', 
                                'http://localhost:8124',
                                'https://localhost:8000');

document.getElementById('sign-in-link').addEventListener('click', (e) => {
  e.preventDefault();
  isicLogin.startLogin();
});

isicLogin.onLoginRedirect((apiCredentials) => {
  document.getElementById('sign-in-link').hidden = true;
  document.getElementById('user-details').innerHTML = JSON.stringify(apiCredentials);
});

isicLogin.maybeRefreshToken();

isicLogin.getGirderToken();
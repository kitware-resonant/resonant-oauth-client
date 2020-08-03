const isicLogin = IsicLogin('9XiMl6OV68cOuzXjTgBuHvolKdEtJBjdrVyfXHa5',
                                        'http://localhost:8080');


            document.querySelector('#sign-in-link').addEventListener('click', (e) => {
                e.preventDefault();
                isicLogin.startLoginFlow();
            });

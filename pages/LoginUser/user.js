const firebaseConfig = {
      apiKey: "AIzaSyC134vzhcUb0srcsvAt9d2fp0rQseZ2tjs",
      authDomain: "numosapp-93e61.firebaseapp.com",
      projectId: "numosapp-93e61",
      storageBucket: "numosapp-93e61.firebasestorage.app",
      messagingSenderId: "1087711194543",
      appId: "1:1087711194543:web:5b00cf83cef5472997d35a"
    };

    firebase.initializeApp(firebaseConfig);

    function login() {
      const email = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value;

      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(response => {
          window.location.href = '/pages/homePage/';
        })
        .catch(error => {
          console.error('Erro ao fazer login:', error);
          alert('Erro ao fazer login, certifique-se que tudo está correto.');
        });
    }

    // Verifica se o usuário já está logado e redireciona
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        window.location.href = '/pages/homePage/';
      }
    });


     AOS.init();

    function validateFields() {
      const form = document.getElementById('loginForm');
      const inputs = form.querySelectorAll('input[type="email"], input[type="password"]');
      const buttonLogin = document.querySelector('.buttonLogin button');

      let allFilled = true;

      inputs.forEach(input => {
        if (input.value.trim() === '') {
          allFilled = false;
        }
      });

      const emailInput = document.getElementById('emailInput');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = emailPattern.test(emailInput.value);

      buttonLogin.disabled = !(allFilled && isEmailValid);
    }

    // Valida enquanto o usuário digita
    document.querySelectorAll('#loginForm input[type="email"], #loginForm input[type="password"]').forEach(input => {
      input.addEventListener('input', validateFields);
    });
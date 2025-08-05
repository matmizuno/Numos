  const firebaseConfig = {
      apiKey: "AIzaSyC134vzhcUb0srcsvAt9d2fp0rQseZ2tjs",
      authDomain: "numosapp-93e61.firebaseapp.com",
      projectId: "numosapp-93e61",
      storageBucket: "numosapp-93e61.firebasestorage.app",
      messagingSenderId: "1087711194543",
      appId: "1:1087711194543:web:5b00cf83cef5472997d35a"
    };

    firebase.initializeApp(firebaseConfig);

    function register() {
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;

      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
          alert("Conta criada com sucesso! Redirecionando para o login...");
          window.location.href = "/pages/LoginUser/"
        })
        .catch(error => {
          console.error('Erro ao registrar:', error);
          alert("Erro ao criar conta: " + error.message);
        });
    }
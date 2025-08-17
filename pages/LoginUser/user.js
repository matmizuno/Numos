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
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = '/pages/homePage/';
    })
    .catch(error => {
      console.error('Erro ao fazer login:', error);
      if (window.Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Erro no login',
          text: 'Certifique-se que o e-mail e a senha estão corretos.'
        });
      } else {
        alert('Erro no login. Verifique e-mail e senha.');
      }
    });
}

// Verifica se o usuário já está logado
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    window.location.href = '/pages/homePage/';
  }
});

// Inicializa AOS com segurança (não quebra se AOS não estiver carregado)
if (window.AOS && typeof AOS.init === 'function') {
  AOS.init();
}

// Validação de campos
function validateFields() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="email"], input[type="password"]');
  const buttonLogin = document.querySelector('.buttonLogin button');
  if (!buttonLogin) return;

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

// Garante que os listeners sejam anexados após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  // Evita submit do form recarregar a página
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      login();
    });
  }

  // Garante que o botão de recuperação não submeta o form e chama a função
  const recoverBtn = document.getElementById('recuperarSenha');
  if (recoverBtn) {
    recoverBtn.setAttribute('type', 'button');
    recoverBtn.addEventListener('click', (e) => {
      e.preventDefault();
      recuperarSenha();
    });
  }

  // Listeners de validação e estado inicial
  document.querySelectorAll('#loginForm input[type="email"], #loginForm input[type="password"]').forEach(input => {
    input.addEventListener('input', validateFields);
  });
  validateFields();
});

// Loading
function showLoading() {
  if (window.Swal) {
    Swal.fire({
      title: 'Aguarde...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  } else {
    console.log('Aguarde...');
  }
}

function hideLoading() {
  if (window.Swal) {
    Swal.close();
  }
}

// Mensagens de erro
function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail.';
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Formato de e-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Falha de rede. Verifique sua conexão.';
    default:
      return 'Ocorreu um erro ao tentar recuperar a senha.';
  }
}

// Recuperação de senha
function recuperarSenha() {
  const emailInput = document.getElementById('emailInput');
  const email = (emailInput ? emailInput.value : '').trim().toLowerCase();

  if (!email) {
    if (window.Swal) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Por favor, insira seu e-mail para recuperar a senha.'
      });
    } else {
      alert('Por favor, insira seu e-mail para recuperar a senha.');
    }
    return;
  }

  showLoading();

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      hideLoading();

      // Alerta principal (SweetAlert2)
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: 'E-mail de recuperação enviado!',
          text: `Enviamos um link para ${email}. Verifique sua caixa de entrada.`
        });
      }

      // Fallback para garantir que o alerta seja exibido
      if (!window.Swal) {
        alert(`E-mail de recuperação enviado para ${email}. Verifique sua caixa de entrada.`);
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Erro ao enviar e-mail de recuperação:', error);

      const msg = getErrorMessage(error);
      if (window.Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: msg
        });
      } else {
        alert(msg);
      }
    });
}

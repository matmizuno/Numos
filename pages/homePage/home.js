 AOS.init();
function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = '/index.html';
    })
    .catch(error => {
      console.error('Erro ao sair:', error);
    });
}

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    verificarAlerta(user);
    findRecentTransactions(user);
  }
});

function verificarAlerta(user) {
  const alertaEl = document.getElementById('alertaBoasVindas');

  firebase.firestore().collection('alerts').doc(user.uid).get()
    .then(doc => {
      const data = doc.data();
      
      if (!data || data.alertaLogin !== 'nao') {
        alertaEl.style.display = 'block';
      } else {
        alertaEl.style.display = 'none'; 
      }
    })
    .catch(error => {
      console.error('Erro ao verificar alerta:', error);
    });
}

function fecharAlerta() {
  const user = firebase.auth().currentUser;
  const valorEscolhido = document.querySelector('input[name="verAlerta"]:checked').value;

  if (valorEscolhido === 'nao') {
    firebase.firestore().collection('alerts').doc(user.uid).set({
      alertaLogin: 'nao'
    }, { merge: true });
  } else {
    firebase.firestore().collection('alerts').doc(user.uid).delete()
      .then(() => {
        console.log('Dado de alertaLogin removido.');
      })
      .catch(error => {
        console.error('Erro ao remover dado de alertaLogin:', error);
      });
  }

  document.getElementById('alertaBoasVindas').style.display = 'none';
}

function findRecentTransactions(user) {
  firebase.firestore().collection('transactions')
    .where('user.uid', '==', user.uid)
    .orderBy('date', 'desc')
    .get()
    .then(snapshot => {
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Incluindo o ID do documento
      }));
      addTransaction(transactions);
    });
}

function addTransaction(transactions) {
  const transactionsList = document.getElementById('transactions');
  transactionsList.innerHTML = '';

  transactions.forEach(transaction => {
    const divDespesa = document.createElement('div');
    divDespesa.className = 'despesa';

    const liTipo = document.createElement('li');
    liTipo.className = 'transaction-item tipo';
    liTipo.textContent = transaction.transactiontype;

    const liData = document.createElement('li');
    liData.className = 'transaction-item data';
    liData.textContent = formateDate(transaction.date);

    const liValor = document.createElement('li');
    liValor.className = 'transaction-item valor';
    liValor.textContent = `${transaction.money.currency} ${transaction.money.value.toFixed(2)}`;

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.className = 'btn-excluir';
    btnExcluir.onclick = () => deleteTransaction(transaction.id); // Passando o ID corretamente

    divDespesa.appendChild(liTipo);
    divDespesa.appendChild(liData);
    divDespesa.appendChild(liValor);
    divDespesa.appendChild(btnExcluir);

    transactionsList.appendChild(divDespesa);
  });
}

function formateDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function deleteTransaction(transactionId) {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Você precisa estar logado para excluir a despesa.");
    return;
  }

  firebase.firestore().collection('transactions').doc(transactionId).delete()
    .then(() => {
      console.log('Despesa excluída com sucesso!');
      findRecentTransactions(user); // Atualiza a lista de transações após a exclusão
    })
    .catch(error => {
      console.error('Erro ao excluir despesa:', error);
    });
}

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

function findRecentTransactions(user) {
  firebase.firestore().collection('transactions')
    .where('user.uid', '==', user.uid)
    .orderBy('date', 'desc')
    .get()
    .then(snapshot => {
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
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
    btnExcluir.onclick = () => deleteTransaction(transaction.id);

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
      findRecentTransactions(user);
    })
    .catch(error => {
      console.error('Erro ao excluir despesa:', error);
    });
}

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Soma de receitas
    firebase.firestore().collection('receita')
      .where('user.uid', '==', user.uid)
      .onSnapshot(snapshot => {
        let totalReceita = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.receita && typeof data.receita.valorReceita === 'number') {
            totalReceita += data.receita.valorReceita;
          }
        });
        document.getElementById('valorReceita').textContent =
          `R$ ${totalReceita.toFixed(2).replace('.', ',')}`;
      });

    // Soma de despesas APENAS do mês atual
    firebase.firestore().collection('transactions')
      .where('user.uid', '==', user.uid)
      .where('type', '==', 'expense')
      .onSnapshot(snapshot => {
        let totalDespesa = 0;
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.money && typeof data.money.value === 'number') {
            const dataDespesa = new Date(data.date);
            if (dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual) {
              totalDespesa += data.money.value;
            }
          }
        });

        document.getElementById('valorDespesa').textContent =
          `R$ ${totalDespesa.toFixed(2).replace('.', ',')}`;
      });

  } else {
    document.getElementById('valorReceita').textContent = "R$ 0,00";
    document.getElementById('valorDespesa').textContent = "R$ 0,00";
  }
});

// =================== GRÁFICO DE ROSCA ===================
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  const db = firebase.firestore();
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  let totalReceitaMes = 0;
  let totalDespesaMes = 0;

  // Buscar receitas
  db.collection('receita')
    .where('user.uid', '==', user.uid)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (typeof data.receita?.valorReceita === 'number') {
          totalReceitaMes += data.receita.valorReceita;
        }
      });

      // Buscar despesas
      return db.collection('transactions')
        .where('user.uid', '==', user.uid)
        .where('type', '==', 'expense')
        .get();
    })
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (typeof data.money?.value === 'number') {
          const dataDespesa = new Date(data.date);
          if (dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual) {
            totalDespesaMes += data.money.value;
          }
        }
      });

      if (totalReceitaMes <= 0) {
        totalReceitaMes = 1;
      }
      if (totalDespesaMes > totalReceitaMes) {
        totalDespesaMes = totalReceitaMes;
      }

      document.getElementById('totalDespesasMesAtual').textContent =
        `R$ ${totalReceitaMes.toFixed(2).replace('.', ',')}`;
      document.getElementById('valorMensal').textContent =
        `R$ ${totalDespesaMes.toFixed(2).replace('.', ',')}`;

      const restante = totalReceitaMes - totalDespesaMes;

      const ctx = document.getElementById('graficoRosca').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Despesas', 'Restante da Receita'],
          datasets: [{
            data: [totalDespesaMes, restante],
            backgroundColor: ['#4B9CD3', '#A7C7E7'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro ao gerar gráfico:', error);
    });
});

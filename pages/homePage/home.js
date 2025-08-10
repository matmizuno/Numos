AOS.init();

// Exibe o nome do mês atual no elemento <p id="mesAtual">
const nomeMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
document.getElementById('mesAtual').textContent = nomeMeses[new Date().getMonth()];

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
  // espera 'YYYY-MM-DD' ou outros formatos que o Date aceite
  const [year, month, day] = ('' + dateString).split('-').map(Number);
  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  // fallback
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('pt-BR');
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

/* =================== Valores dinâmicos (receita/ despesa atual) =================== */
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
            // tenta interpretar a data com segurança
            let dataDespesa;
            const dateField = data.date;
            if (dateField && typeof dateField === 'object' && typeof dateField.toDate === 'function') {
              dataDespesa = dateField.toDate();
            } else if (typeof dateField === 'string' && dateField.indexOf('-') !== -1) {
              const parts = dateField.split('-').map(Number);
              dataDespesa = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              dataDespesa = new Date(dateField);
            }

            if (!isNaN(dataDespesa.getTime()) &&
                dataDespesa.getMonth() === mesAtual &&
                dataDespesa.getFullYear() === anoAtual) {
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

/* =================== GRÁFICO DE ROSCA (EXISTENTE) =================== */
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
          // interpreta data com segurança
          let dataDespesa;
          const dateField = data.date;
          if (dateField && typeof dateField === 'object' && typeof dateField.toDate === 'function') {
            dataDespesa = dateField.toDate();
          } else if (typeof dateField === 'string' && dateField.indexOf('-') !== -1) {
            const parts = dateField.split('-').map(Number);
            dataDespesa = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
            dataDespesa = new Date(dateField);
          }

          if (!isNaN(dataDespesa.getTime()) &&
              dataDespesa.getMonth() === mesAtual &&
              dataDespesa.getFullYear() === anoAtual) {
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

      // destrói gráfico anterior se existir (evita sobreposição ao recarregar)
      if (window.graficoRoscaChart) {
        try { window.graficoRoscaChart.destroy(); } catch (e) { /* não faz nada */ }
      }

      const ctx = document.getElementById('graficoRosca').getContext('2d');
      window.graficoRoscaChart = new Chart(ctx, {
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

/* =================== NOVO: GRÁFICO DE ROSCA - MÊS PASSADO ===================
   (gera somente em #graficoRoscaMesPassado, preenche #mesPassado, #receitaMesPassado, #despesaMesPassado)
   Não altera o gráfico existente.
*/
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  const db = firebase.firestore();

  const hoje = new Date();
  let mesPassado = hoje.getMonth() - 1;
  let anoMesPassado = hoje.getFullYear();
  if (mesPassado < 0) {
    mesPassado = 11;
    anoMesPassado -= 1;
  }

  let totalReceitaPassado = 0;
  let totalDespesaPassado = 0;

  // Busca receitas do mês passado
  db.collection('receita')
    .where('user.uid', '==', user.uid)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        // interpreta campo date (suporta string 'YYYY-MM-DD' e Timestamp)
        let dataReceita;
        const dateField = data.date;
        if (dateField && typeof dateField === 'object' && typeof dateField.toDate === 'function') {
          dataReceita = dateField.toDate();
        } else if (typeof dateField === 'string' && dateField.indexOf('-') !== -1) {
          const parts = dateField.split('-').map(Number);
          dataReceita = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          dataReceita = new Date(dateField);
        }

        if (!isNaN(dataReceita.getTime()) &&
            dataReceita.getMonth() === mesPassado &&
            dataReceita.getFullYear() === anoMesPassado &&
            typeof data.receita?.valorReceita === 'number') {
          totalReceitaPassado += data.receita.valorReceita;
        }
      });

      // Buscar despesas do mês passado
      return db.collection('transactions')
        .where('user.uid', '==', user.uid)
        .where('type', '==', 'expense')
        .get();
    })
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        // interpreta campo date (suporta string 'YYYY-MM-DD' e Timestamp)
        let dataDespesa;
        const dateField = data.date;
        if (dateField && typeof dateField === 'object' && typeof dateField.toDate === 'function') {
          dataDespesa = dateField.toDate();
        } else if (typeof dateField === 'string' && dateField.indexOf('-') !== -1) {
          const parts = dateField.split('-').map(Number);
          dataDespesa = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          dataDespesa = new Date(dateField);
        }

        if (!isNaN(dataDespesa.getTime()) &&
            dataDespesa.getMonth() === mesPassado &&
            dataDespesa.getFullYear() === anoMesPassado &&
            typeof data.money?.value === 'number') {
          totalDespesaPassado += data.money.value;
        }
      });

      // Atualiza os textos com os VALORES REAIS (sem ajustes)
      document.getElementById('receitaMesPassado').textContent =
        `R$ ${totalReceitaPassado.toFixed(2).replace('.', ',')}`;
      document.getElementById('despesaMesPassado').textContent =
        `R$ ${totalDespesaPassado.toFixed(2).replace('.', ',')}`;

      // Exibe o nome do mês passado
      document.getElementById('mesPassado').textContent = nomeMeses[mesPassado];

      // Preparar valores para o gráfico:
      // O gráfico deve mostrar a receita como "todo" (100%) e a despesa ocupando a parte proporcional.
      // Para evitar problemas com receita = 0, usamos chartReceita >= 1 e ajustamos chartDespesa <= chartReceita.
      let chartReceita = totalReceitaPassado;
      let chartDespesa = totalDespesaPassado;
      if (chartReceita <= 0) chartReceita = 1;
      if (chartDespesa > chartReceita) chartDespesa = chartReceita;
      const restante = chartReceita - chartDespesa;

      // destrói gráfico anterior do mês passado se existir
      if (window.graficoRoscaMesPassadoChart) {
        try { window.graficoRoscaMesPassadoChart.destroy(); } catch (e) { /* ignore */ }
      }

      // Cria gráfico no canvas #graficoRoscaMesPassado com tons de azul
      const canvasEl = document.getElementById('graficoRoscaMesPassado');
      if (!canvasEl) {
        console.warn('Canvas #graficoRoscaMesPassado não encontrado no HTML.');
        return;
      }
      const ctx = canvasEl.getContext('2d');
      window.graficoRoscaMesPassadoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Despesas', 'Restante da Receita'],
          datasets: [{
            data: [chartDespesa, restante],
            backgroundColor: ['#3B82F6', '#93C5FD'],
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
      console.error('Erro ao gerar gráfico do mês passado:', error);
    });
});

/* =================== NOVO: GRÁFICO DE BARRAS - ÚLTIMOS 6 MESES =================== */
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  const db = firebase.firestore();
  const hoje = new Date();
  const nomeMesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Cria um array com {mes, ano} dos últimos 6 meses (incluindo atual)
  const mesesUltimos6 = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    mesesUltimos6.push({ mes: d.getMonth(), ano: d.getFullYear() });
  }

  // Objeto para acumular valores por mês/ano
  const totaisPorMes = {};
  mesesUltimos6.forEach(({ mes, ano }) => {
    totaisPorMes[`${ano}-${mes}`] = 0;
  });

  db.collection('transactions')
    .where('user.uid', '==', user.uid)
    .where('type', '==', 'expense')
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        let dataDespesa;
        const dateField = data.date;
        if (dateField && typeof dateField === 'object' && typeof dateField.toDate === 'function') {
          dataDespesa = dateField.toDate();
        } else if (typeof dateField === 'string' && dateField.includes('-')) {
          const parts = dateField.split('-').map(Number);
          dataDespesa = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          dataDespesa = new Date(dateField);
        }

        if (!isNaN(dataDespesa.getTime())) {
          const mes = dataDespesa.getMonth();
          const ano = dataDespesa.getFullYear();
          const chave = `${ano}-${mes}`;

          if (totaisPorMes.hasOwnProperty(chave) && typeof data.money?.value === 'number') {
            totaisPorMes[chave] += data.money.value;
          }
        }
      });

      // Prepara dados para o gráfico na ordem do mais antigo para o mais recente
      const labels = [];
      const valores = [];
      for (let i = mesesUltimos6.length - 1; i >= 0; i--) {
        const { mes, ano } = mesesUltimos6[i];
        labels.push(`${nomeMesesAbrev[mes]}/${ano}`);
        valores.push(totaisPorMes[`${ano}-${mes}`]);
      }

      const ctx = document.getElementById('graficoSemestralCanvas').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Despesas (R$)',
            data: valores,
            backgroundColor: '#4B9CD3'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return 'R$ ' + value.toFixed(2).replace('.', ',');
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro ao gerar gráfico semestral:', error);
    });
});

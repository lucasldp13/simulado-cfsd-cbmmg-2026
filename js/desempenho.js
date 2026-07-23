/**
 * desempenho.js
 * Lógica da área "Desempenho": mostra progresso em andamento (se houver
 * simulado incompleto) e o resultado final detalhado (quando concluído),
 * com plano de revisão e estimativa realista de preparação.
 */

const Desempenho = (() => {
  const DATA_PROVA = new Date('2026-07-26T13:00:00-03:00');

  function diasAteProva() {
    const hoje = new Date();
    const diffMs = DATA_PROVA - hoje;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  async function renderizar(container) {
    container.innerHTML = '<p class="carregando">Carregando desempenho...</p>';
    try {
      await Simulado.carregarQuestoes();
      const estado = Armazenamento.carregar();

      if (estado.simulado.situacao === 'nao_iniciado') {
        container.innerHTML = `
          <h2>Desempenho</h2>
          <p>Você ainda não iniciou o simulado. Vá até a aba "Simulado" para começar.</p>
        `;
        return;
      }

      if (estado.simulado.situacao === 'em_andamento') {
        renderizarEmAndamento(container, estado);
        return;
      }

      renderizarResultadoFinal(container);
    } catch (erro) {
      console.error(erro);
      container.innerHTML = '<p class="erro">Erro ao carregar o desempenho.</p>';
    }
  }

  function renderizarEmAndamento(container, estado) {
    const resultado = Simulado.calcularResultado();
    const respondidas = resultado.totalRespondidas;
    const restantes = resultado.totalQuestoes - respondidas;

    container.innerHTML = `
      <h2>Desempenho</h2>
      <p>Simulado em andamento: ${respondidas} de ${resultado.totalQuestoes} questões respondidas (${restantes} restantes).</p>
      <p>Acertos até agora: ${resultado.totalAcertos} — Erros até agora: ${resultado.totalErros}</p>
      ${renderizarTabelaMaterias(resultado.porMateria)}
      <div class="acoes-desempenho">
        <button id="btn-continuar-simulado" class="btn btn-primario">Continuar simulado</button>
        <button id="btn-apagar-progresso" class="btn btn-perigo">Apagar progresso e reiniciar</button>
      </div>
    `;
    document.getElementById('btn-continuar-simulado').addEventListener('click', () => App.navegarPara('simulado'));
    document.getElementById('btn-apagar-progresso').addEventListener('click', () => {
      Simulado.confirmarReinicio();
      renderizar(document.getElementById('conteudo-principal'));
    });
  }

  function renderizarTabelaMaterias(porMateria) {
    const linhas = Object.entries(porMateria).map(([materia, dados]) => {
      const percentual = dados.total ? ((dados.acertos / dados.total) * 100).toFixed(0) : '0';
      return `
        <tr>
          <td>${materia}</td>
          <td>${dados.acertos}</td>
          <td>${dados.erros}</td>
          <td>${dados.total}</td>
          <td>${percentual}%</td>
        </tr>
      `;
    }).join('');

    return `
      <table class="tabela-desempenho">
        <thead>
          <tr><th>Matéria</th><th>Acertos</th><th>Erros</th><th>Respondidas</th><th>%</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function assuntosComMaisErros(porMateria) {
    const contagem = {};
    Object.values(porMateria).forEach(dados => {
      Object.entries(dados.assuntosErrados).forEach(([assunto, qtd]) => {
        contagem[assunto] = (contagem[assunto] || 0) + qtd;
      });
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  function estimativaPreparacao(percentual) {
    if (percentual >= 80) {
      return 'Desempenho consistente com boa preparação para os conteúdos cobrados até aqui. Continue revisando os pontos fracos identificados e refazendo simulados para manter o ritmo até a prova.';
    }
    if (percentual >= 60) {
      return 'Desempenho intermediário. Há uma base de conhecimento, mas os erros indicam lacunas que merecem revisão focada antes da prova.';
    }
    if (percentual >= 40) {
      return 'Desempenho abaixo do necessário para uma aprovação segura. É recomendável revisar sistematicamente os conteúdos do Estudo Direcionado, especialmente nas matérias com mais erros, e refazer o simulado.';
    }
    return 'Desempenho indica necessidade de estudo aprofundado da maior parte do conteúdo programático antes da prova. Priorize o Estudo Direcionado matéria por matéria.';
  }

  function registrarResultadoNoHistorico(estado, resultado) {
    const porMateriaResumo = {};
    Object.entries(resultado.porMateria).forEach(([materia, dados]) => {
      porMateriaResumo[materia] = {
        acertos: dados.acertos,
        total: dados.total,
        percentual: dados.total ? (dados.acertos / dados.total) * 100 : 0
      };
    });
    Armazenamento.registrarNoHistorico({
      dataInicio: estado.simulado.dataInicio,
      dataFim: estado.simulado.dataFim,
      totalAcertos: resultado.totalAcertos,
      totalErros: resultado.totalErros,
      totalQuestoes: resultado.totalQuestoes,
      percentualGeral: resultado.percentualGeral,
      porMateria: porMateriaResumo
    });
  }

  function renderizarGraficoEvolucao(historico) {
    if (historico.length < 2) {
      return '<p>Complete pelo menos 2 simulados para visualizar a curva de evolução.</p>';
    }
    const largura = 600;
    const altura = 220;
    const margem = { topo: 20, baixo: 30, esquerda: 40, direita: 20 };
    const areaLargura = largura - margem.esquerda - margem.direita;
    const areaAltura = altura - margem.topo - margem.baixo;
    const n = historico.length;

    const x = i => margem.esquerda + (n === 1 ? 0 : (i / (n - 1)) * areaLargura);
    const y = pct => margem.topo + areaAltura - (pct / 100) * areaAltura;

    const pontos = historico.map((h, i) => `${x(i).toFixed(1)},${y(h.percentualGeral).toFixed(1)}`).join(' ');
    const circulos = historico.map((h, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(h.percentualGeral).toFixed(1)}" r="4" fill="#b3121b"></circle>`).join('');
    const linhasGuia = [0, 25, 50, 75, 100].map(pct => `
      <line x1="${margem.esquerda}" y1="${y(pct).toFixed(1)}" x2="${largura - margem.direita}" y2="${y(pct).toFixed(1)}" stroke="#e2e5e9" stroke-width="1"></line>
      <text x="2" y="${(y(pct) + 4).toFixed(1)}" font-size="10" fill="#4b5563">${pct}%</text>
    `).join('');
    const rotulosX = historico.map((h, i) => {
      const data = new Date(h.dataFim);
      const rotulo = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `<text x="${x(i).toFixed(1)}" y="${altura - 8}" font-size="10" fill="#4b5563" text-anchor="middle">${rotulo}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${largura} ${altura}" class="grafico-evolucao" role="img" aria-label="Gráfico de evolução do percentual de acertos ao longo dos simulados">
        ${linhasGuia}
        <polyline points="${pontos}" fill="none" stroke="#b3121b" stroke-width="2"></polyline>
        ${circulos}
        ${rotulosX}
      </svg>
    `;
  }

  function renderizarHistorico(historico) {
    if (!historico.length) return '';
    const linhas = historico.map((h, i) => {
      const data = new Date(h.dataFim);
      const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${dataFormatada}</td>
          <td>${h.totalAcertos} / ${h.totalQuestoes}</td>
          <td>${h.percentualGeral.toFixed(1)}%</td>
        </tr>
      `;
    }).join('');

    return `
      <h3>Histórico de simulados (evolução)</h3>
      ${renderizarGraficoEvolucao(historico)}
      <table class="tabela-desempenho">
        <thead>
          <tr><th>#</th><th>Data</th><th>Acertos</th><th>% Geral</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      <div class="acoes-desempenho">
        <button id="btn-apagar-historico" class="btn btn-secundario">Apagar histórico de simulados</button>
      </div>
    `;
  }

  function renderizarResultadoFinal(container) {
    const estado = Armazenamento.carregar();
    const resultado = Simulado.calcularResultado();
    registrarResultadoNoHistorico(estado, resultado);
    const historico = Armazenamento.carregarHistorico();
    const assuntosCriticos = assuntosComMaisErros(resultado.porMateria);
    const dias = diasAteProva();

    const assuntosHtml = assuntosCriticos.length
      ? `<ul>${assuntosCriticos.map(([assunto, qtd]) => `<li>${assunto} — ${qtd} erro(s)</li>`).join('')}</ul>`
      : '<p>Nenhum erro registrado.</p>';

    const pontosFortes = Object.entries(resultado.porMateria)
      .filter(([, d]) => d.total && (d.acertos / d.total) >= 0.7)
      .map(([materia]) => materia);
    const pontosFracos = Object.entries(resultado.porMateria)
      .filter(([, d]) => d.total && (d.acertos / d.total) < 0.5)
      .map(([materia]) => materia);

    container.innerHTML = `
      <h2>Desempenho — Resultado Final</h2>
      <div class="resumo-final">
        <p><strong>Total de acertos:</strong> ${resultado.totalAcertos} / ${resultado.totalQuestoes}</p>
        <p><strong>Total de erros:</strong> ${resultado.totalErros} / ${resultado.totalQuestoes}</p>
        <p><strong>Percentual geral:</strong> ${resultado.percentualGeral.toFixed(1)}%</p>
      </div>

      <h3>Resultado por matéria</h3>
      ${renderizarTabelaMaterias(resultado.porMateria)}

      <h3>Assuntos com maior número de erros</h3>
      ${assuntosHtml}

      <h3>Pontos fortes</h3>
      <p>${pontosFortes.length ? pontosFortes.join(', ') : 'Nenhuma matéria atingiu 70% de acertos neste simulado.'}</p>

      <h3>Pontos fracos</h3>
      <p>${pontosFracos.length ? pontosFracos.join(', ') : 'Nenhuma matéria ficou abaixo de 50% de acertos neste simulado.'}</p>

      <h3>Plano de revisão até a prova (26/07/2026)</h3>
      <p>Faltam aproximadamente <strong>${dias} dia(s)</strong> para a data oficial da prova. Recomenda-se:</p>
      <ol>
        <li>Revisar na aba "Estudo Direcionado" os tópicos das matérias com desempenho abaixo de 50%.</li>
        <li>Refazer as questões dos assuntos listados acima com maior número de erros.</li>
        <li>Reiniciar o simulado completo pelo menos uma vez antes da prova para medir evolução.</li>
        <li>Revisar especificamente o Anexo II do Edital CBMMG nº 10/2026 nas matérias com menor percentual.</li>
      </ol>

      <h3>Estimativa realista de nível de preparação</h3>
      <p>${estimativaPreparacao(resultado.percentualGeral)}</p>
      <p class="aviso-estimativa"><em>Esta estimativa é baseada exclusivamente no seu desempenho neste simulado e não constitui garantia de aprovação.</em></p>

      ${renderizarHistorico(historico)}

      <div class="acoes-desempenho">
        <button id="btn-refazer-simulado" class="btn btn-perigo">Apagar progresso e refazer simulado</button>
      </div>
    `;

    document.getElementById('btn-refazer-simulado').addEventListener('click', () => {
      Simulado.confirmarReinicio();
      renderizar(document.getElementById('conteudo-principal'));
    });

    const btnApagarHistorico = document.getElementById('btn-apagar-historico');
    if (btnApagarHistorico) {
      btnApagarHistorico.addEventListener('click', () => {
        const confirmado = window.confirm('Isso apagará permanentemente o histórico de todos os simulados já concluídos, usado para calcular sua curva de evolução. Deseja continuar?');
        if (!confirmado) return;
        Armazenamento.limparHistorico();
        renderizar(document.getElementById('conteudo-principal'));
      });
    }
  }

  return { renderizar };
})();

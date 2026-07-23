/**
 * simulado.js
 * Lógica da área "Simulado": exibe uma questão por vez, aguarda confirmação
 * da resposta do usuário antes de revelar a correção, persiste o progresso
 * via Armazenamento e, ao final, delega o resultado a Desempenho.
 */

const Simulado = (() => {
  let todasQuestoes = [];
  let estado = null;
  let containerEl = null;

  async function carregarQuestoes() {
    if (todasQuestoes.length) return todasQuestoes;
    const resposta = await fetch('data/questoes.json');
    if (!resposta.ok) {
      throw new Error('Não foi possível carregar data/questoes.json');
    }
    todasQuestoes = await resposta.json();
    return todasQuestoes;
  }

  function questaoPorId(id) {
    return todasQuestoes.find(q => q.id === id);
  }

  function ordemOficial() {
    // Mantém a ordem oficial do arquivo (já agrupada por matéria conforme edital).
    return todasQuestoes.map(q => q.id);
  }

  async function renderizar(container) {
    containerEl = container;
    container.innerHTML = '<p class="carregando">Carregando simulado...</p>';
    try {
      await carregarQuestoes();
      estado = Armazenamento.carregar();

      if (estado.simulado.situacao === 'nao_iniciado') {
        renderizarTelaInicio();
      } else if (estado.simulado.situacao === 'em_andamento') {
        renderizarQuestaoAtual();
      } else if (estado.simulado.situacao === 'finalizado') {
        renderizarTelaFinalizado();
      }
    } catch (erro) {
      console.error(erro);
      container.innerHTML = '<p class="erro">Erro ao carregar o simulado. Verifique se data/questoes.json está acessível.</p>';
    }
  }

  function renderizarTelaInicio() {
    containerEl.innerHTML = `
      <h2>Simulado</h2>
      <div class="tela-inicio-simulado">
        <p>O simulado possui ${todasQuestoes.length} questões, seguindo a distribuição oficial do Edital CBMMG nº 10/2026 (Tabela IV).</p>
        <p>As questões são exibidas uma de cada vez. Você precisa confirmar sua resposta antes de ver a correção e avançar.</p>
        <button id="btn-iniciar-simulado" class="btn btn-primario">Iniciar simulado</button>
      </div>
    `;
    document.getElementById('btn-iniciar-simulado').addEventListener('click', () => {
      estado = Armazenamento.iniciarSimulado(estado, ordemOficial());
      renderizarQuestaoAtual();
    });
  }

  function renderizarTelaFinalizado() {
    containerEl.innerHTML = `
      <h2>Simulado</h2>
      <div class="tela-finalizado">
        <p>Você já concluiu este simulado.</p>
        <button id="btn-ver-resultado" class="btn btn-primario">Ver resultado</button>
        <button id="btn-reiniciar" class="btn btn-secundario">Reiniciar simulado</button>
      </div>
    `;
    document.getElementById('btn-ver-resultado').addEventListener('click', () => {
      App.navegarPara('desempenho');
    });
    document.getElementById('btn-reiniciar').addEventListener('click', confirmarReinicio);
  }

  function renderizarQuestaoAtual() {
    const { questaoAtualIndex, ordemQuestoes, respostas } = estado.simulado;

    if (questaoAtualIndex >= ordemQuestoes.length) {
      estado = Armazenamento.finalizarSimulado(estado);
      App.navegarPara('desempenho');
      return;
    }

    const idQuestao = ordemQuestoes[questaoAtualIndex];
    const questao = questaoPorId(idQuestao);
    const respostaExistente = respostas[idQuestao];
    const jaConfirmada = !!(respostaExistente && respostaExistente.confirmada);

    const letras = ['A', 'B', 'C', 'D'];
    const alternativasHtml = letras.map(letra => {
      let classeExtra = '';
      if (jaConfirmada) {
        if (letra === questao.respostaCorreta) classeExtra = ' alternativa-correta';
        else if (letra === respostaExistente.selecionada) classeExtra = ' alternativa-incorreta-selecionada';
      }
      const selecionadaAtributo = (!jaConfirmada && respostaExistente && respostaExistente.selecionada === letra) ? 'checked' : '';
      return `
        <label class="alternativa${classeExtra}">
          <input type="radio" name="alternativa" value="${letra}" ${selecionadaAtributo} ${jaConfirmada ? 'disabled' : ''}>
          <span class="alternativa-letra">${letra}</span>
          <span class="alternativa-texto">${questao.alternativas[letra]}</span>
        </label>
      `;
    }).join('');

    containerEl.innerHTML = `
      <div class="cabecalho-questao">
        <span class="progresso-questao">Questão ${questaoAtualIndex + 1} de ${ordemQuestoes.length}</span>
        <span class="materia-questao">${questao.materia}</span>
      </div>
      <div class="questao-card">
        <p class="enunciado">${questao.enunciado}</p>
        <div class="alternativas-lista">${alternativasHtml}</div>
        <div class="acoes-questao">
          ${jaConfirmada
            ? '<button id="btn-proxima" class="btn btn-primario">Próxima questão</button>'
            : '<button id="btn-confirmar" class="btn btn-primario" disabled>Confirmar resposta</button>'}
        </div>
        <div id="correcao-area">${jaConfirmada ? renderizarCorrecao(questao, respostaExistente) : ''}</div>
      </div>
    `;

    if (!jaConfirmada) {
      const radios = containerEl.querySelectorAll('input[name="alternativa"]');
      const btnConfirmar = document.getElementById('btn-confirmar');
      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          btnConfirmar.disabled = false;
        });
      });
      btnConfirmar.addEventListener('click', () => {
        const selecionada = containerEl.querySelector('input[name="alternativa"]:checked');
        if (!selecionada) return;
        confirmarResposta(questao, selecionada.value);
      });
    } else {
      document.getElementById('btn-proxima').addEventListener('click', () => {
        estado = Armazenamento.avancarQuestao(estado);
        renderizarQuestaoAtual();
      });
    }
  }

  function confirmarResposta(questao, letraSelecionada) {
    const correta = letraSelecionada === questao.respostaCorreta;
    estado = Armazenamento.registrarResposta(estado, questao.id, letraSelecionada, correta);
    renderizarQuestaoAtual();
  }

  function renderizarCorrecao(questao, resposta) {
    const letras = ['A', 'B', 'C', 'D'];
    const explicacoesErradasHtml = letras
      .filter(l => l !== questao.respostaCorreta)
      .map(l => `<li><strong>${l}:</strong> ${questao.explicacaoAlternativas[l] || ''}</li>`)
      .join('');

    return `
      <div class="correcao ${resposta.correta ? 'correcao-acerto' : 'correcao-erro'}">
        <p class="correcao-status">${resposta.correta ? '✔ Você acertou!' : '✘ Você errou.'}</p>
        <p><strong>Alternativa correta:</strong> ${questao.respostaCorreta} — ${questao.explicacaoCorreta}</p>
        <p><strong>Por que as demais estão erradas:</strong></p>
        <ul>${explicacoesErradasHtml}</ul>
        <div class="correcao-meta">
          <p><strong>Matéria:</strong> ${questao.materia} — <strong>Assunto:</strong> ${questao.assunto}</p>
          <p><strong>Conteúdo relacionado no edital:</strong> ${questao.referenciaEdital}</p>
          <p><strong>Dificuldade:</strong> ${questao.dificuldade}</p>
          <p><strong>Fonte:</strong> ${questao.fonte}, p. ${questao.pagina}</p>
        </div>
      </div>
    `;
  }

  function confirmarReinicio() {
    const confirmado = window.confirm('Isso apagará todo o seu progresso no simulado (respostas, acertos e erros). Deseja continuar?');
    if (!confirmado) return;
    estado = Armazenamento.limpar();
    renderizarTelaInicio();
  }

  function calcularResultado() {
    if (!estado) estado = Armazenamento.carregar();
    const { respostas } = estado.simulado;
    const porMateria = {};

    todasQuestoes.forEach(questao => {
      if (!porMateria[questao.materia]) {
        porMateria[questao.materia] = { total: 0, acertos: 0, erros: 0, assuntosErrados: {} };
      }
      const r = respostas[questao.id];
      if (!r) return;
      porMateria[questao.materia].total += 1;
      if (r.correta) {
        porMateria[questao.materia].acertos += 1;
      } else {
        porMateria[questao.materia].erros += 1;
        const chave = questao.assunto;
        porMateria[questao.materia].assuntosErrados[chave] = (porMateria[questao.materia].assuntosErrados[chave] || 0) + 1;
      }
    });

    const totalRespondidas = Object.keys(respostas).length;
    const totalAcertos = Object.values(respostas).filter(r => r.correta).length;
    const totalErros = totalRespondidas - totalAcertos;

    return {
      totalQuestoes: todasQuestoes.length,
      totalRespondidas,
      totalAcertos,
      totalErros,
      percentualGeral: totalRespondidas ? (totalAcertos / totalRespondidas) * 100 : 0,
      porMateria,
      dataInicio: estado.simulado.dataInicio,
      dataFim: estado.simulado.dataFim
    };
  }

  return {
    renderizar,
    carregarQuestoes,
    calcularResultado,
    confirmarReinicio
  };
})();

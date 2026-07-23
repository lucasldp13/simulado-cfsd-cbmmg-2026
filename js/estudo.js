/**
 * estudo.js
 * Lógica da área "Estudo Direcionado": lista as matérias e, para cada uma,
 * exibe os tópicos previstos no edital com prioridade, forma de cobrança,
 * pegadinhas, erros frequentes, pontos de atenção, exemplo e fonte.
 */

const Estudo = (() => {
  let dadosEstudo = null;

  async function carregarDados() {
    if (dadosEstudo) return dadosEstudo;
    const resposta = await fetch('data/estudos.json');
    if (!resposta.ok) {
      throw new Error('Não foi possível carregar data/estudos.json');
    }
    dadosEstudo = await resposta.json();
    return dadosEstudo;
  }

  function badgePrioridade(nivel) {
    const texto = nivel === 'alta' ? 'Prioridade alta' : 'Prioridade média';
    const classe = nivel === 'alta' ? 'badge badge-alta' : 'badge badge-media';
    return `<span class="${classe}">${texto}</span>`;
  }

  function renderizarTopico(topico) {
    return `
      <details class="topico-card">
        <summary>
          ${badgePrioridade(topico.nivelPrioridade)}
          <span class="topico-titulo">${topico.titulo}</span>
        </summary>
        <div class="topico-corpo">
          <p><strong>Conteúdo previsto no edital:</strong> ${topico.conteudoPrevisto}</p>
          <p><strong>Forma mais comum de cobrança:</strong> ${topico.formaCobranca}</p>
          <p><strong>Possíveis pegadinhas:</strong> ${topico.pegadinhas}</p>
          <p><strong>Erros frequentes dos candidatos:</strong> ${topico.errosFrequentes}</p>
          <p><strong>Pontos que merecem maior atenção:</strong> ${topico.pontosAtencao}</p>
          <p><strong>Exemplo:</strong> ${topico.exemplo}</p>
          <p class="topico-fonte"><strong>Fonte:</strong> ${topico.fonte}</p>
        </div>
      </details>
    `;
  }

  function renderizarMateria(materia) {
    const topicosHtml = materia.topicos.map(renderizarTopico).join('');
    return `
      <section class="materia-card" id="materia-${materia.id}">
        <h3>${materia.nome}</h3>
        <p class="materia-meta">${materia.questoes} questões — até ${materia.pontuacaoMaxima.toFixed(1)} pontos — fonte: ${materia.fonte}, p. ${materia.pagina}</p>
        ${materia.avisoEspecifico ? `<p class="aviso-especifico">⚠ ${materia.avisoEspecifico}</p>` : ''}
        <div class="topicos-lista">${topicosHtml}</div>
      </section>
    `;
  }

  async function renderizar(container) {
    container.innerHTML = '<p class="carregando">Carregando conteúdo de estudo...</p>';
    try {
      const dados = await carregarDados();
      const aviso = `<p class="aviso-recorrencia">${dados.avisoRecorrencia}</p>`;
      const materiasHtml = dados.materias.map(renderizarMateria).join('');
      container.innerHTML = `
        <h2>Estudo Direcionado</h2>
        ${aviso}
        <div class="materias-container">${materiasHtml}</div>
      `;
    } catch (erro) {
      console.error(erro);
      container.innerHTML = '<p class="erro">Erro ao carregar o conteúdo de estudo. Verifique se data/estudos.json está acessível.</p>';
    }
  }

  return { renderizar, carregarDados };
})();

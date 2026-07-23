/**
 * armazenamento.js
 * Camada de persistência local (localStorage) do progresso do simulado.
 * Nenhum outro módulo deve acessar localStorage diretamente — tudo passa por aqui.
 */

const Armazenamento = (() => {
  const CHAVE = 'cfsd_cbmmg_2026_progresso';
  const VERSAO_ESQUEMA = 1;

  function estadoInicial() {
    return {
      versao: VERSAO_ESQUEMA,
      simulado: {
        situacao: 'nao_iniciado', // 'nao_iniciado' | 'em_andamento' | 'finalizado'
        questaoAtualIndex: 0,
        ordemQuestoes: [], // ids das questões, na ordem em que serão exibidas
        respostas: {},     // { idQuestao: { selecionada: 'A', correta: true/false, confirmada: true } }
        dataInicio: null,
        dataUltimaAtividade: null,
        dataFim: null
      }
    };
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return estadoInicial();
      const dados = JSON.parse(bruto);
      if (!dados || dados.versao !== VERSAO_ESQUEMA || !dados.simulado) {
        return estadoInicial();
      }
      return dados;
    } catch (erro) {
      console.error('Falha ao ler progresso salvo, reiniciando estado.', erro);
      return estadoInicial();
    }
  }

  function salvar(estado) {
    try {
      estado.simulado.dataUltimaAtividade = new Date().toISOString();
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      console.error('Falha ao salvar progresso.', erro);
    }
  }

  function limpar() {
    localStorage.removeItem(CHAVE);
    return estadoInicial();
  }

  function iniciarSimulado(estado, ordemQuestoes) {
    estado.simulado.situacao = 'em_andamento';
    estado.simulado.questaoAtualIndex = 0;
    estado.simulado.ordemQuestoes = ordemQuestoes;
    estado.simulado.respostas = {};
    estado.simulado.dataInicio = new Date().toISOString();
    estado.simulado.dataFim = null;
    salvar(estado);
    return estado;
  }

  function registrarResposta(estado, idQuestao, letraSelecionada, correta) {
    estado.simulado.respostas[idQuestao] = {
      selecionada: letraSelecionada,
      correta: correta,
      confirmada: true
    };
    salvar(estado);
    return estado;
  }

  function avancarQuestao(estado) {
    estado.simulado.questaoAtualIndex += 1;
    salvar(estado);
    return estado;
  }

  function finalizarSimulado(estado) {
    estado.simulado.situacao = 'finalizado';
    estado.simulado.dataFim = new Date().toISOString();
    salvar(estado);
    return estado;
  }

  function temProgressoSalvo() {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return false;
    try {
      const dados = JSON.parse(bruto);
      return !!(dados && dados.simulado && dados.simulado.situacao !== 'nao_iniciado');
    } catch {
      return false;
    }
  }

  return {
    carregar,
    salvar,
    limpar,
    iniciarSimulado,
    registrarResposta,
    avancarQuestao,
    finalizarSimulado,
    temProgressoSalvo
  };
})();

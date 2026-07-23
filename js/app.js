/**
 * app.js
 * Ponto de entrada da aplicação: controla a navegação entre as três áreas
 * (Estudo Direcionado, Simulado, Desempenho) e a inicialização geral.
 */

const App = (() => {
  const AREAS = {
    estudo: { titulo: 'Estudo Direcionado', render: Estudo.renderizar },
    simulado: { titulo: 'Simulado', render: Simulado.renderizar },
    desempenho: { titulo: 'Desempenho', render: Desempenho.renderizar }
  };

  let areaAtual = 'estudo';

  function navegarPara(area) {
    if (!AREAS[area]) return;
    areaAtual = area;
    atualizarNavAtiva();
    const container = document.getElementById('conteudo-principal');
    AREAS[area].render(container);
    window.location.hash = area;
  }

  function atualizarNavAtiva() {
    document.querySelectorAll('.nav-botao').forEach(btn => {
      btn.classList.toggle('ativo', btn.dataset.area === areaAtual);
    });
  }

  function configurarNavegacao() {
    document.querySelectorAll('.nav-botao').forEach(btn => {
      btn.addEventListener('click', () => navegarPara(btn.dataset.area));
    });
  }

  function iniciar() {
    configurarNavegacao();
    const areaInicial = window.location.hash.replace('#', '');
    navegarPara(AREAS[areaInicial] ? areaInicial : 'estudo');
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return { navegarPara };
})();

#!/usr/bin/env node
/**
 * validar_questoes.js
 * Script de validação automática de data/questoes.json.
 * Uso: node scripts/validar_questoes.js
 * Sai com código 0 se tudo estiver correto, ou código 1 e lista de erros caso contrário.
 */

const fs = require('fs');
const path = require('path');

const CAMINHO_QUESTOES = path.join(__dirname, '..', 'data', 'questoes.json');
const CAMINHO_FONTES = path.join(__dirname, '..', 'fontes');

const DISTRIBUICAO_OFICIAL = {
  'Língua Portuguesa': 10,
  'Raciocínio Lógico e Matemático': 5,
  'Noções de Direitos Humanos e Legislação': 10,
  'Ciências Naturais': 10,
  'Ciências Humanas': 10,
  'Proteção e Defesa Civil': 5
};

const CAMPOS_OBRIGATORIOS = [
  'id', 'materia', 'assunto', 'enunciado', 'alternativas', 'respostaCorreta',
  'explicacaoCorreta', 'explicacaoAlternativas', 'referenciaEdital', 'fonte',
  'pagina', 'dificuldade'
];

const LETRAS = ['A', 'B', 'C', 'D'];

function erro(lista, msg) {
  lista.push(msg);
}

function validar() {
  const erros = [];

  if (!fs.existsSync(CAMINHO_QUESTOES)) {
    console.error(`Arquivo não encontrado: ${CAMINHO_QUESTOES}`);
    process.exit(1);
  }

  let questoes;
  try {
    questoes = JSON.parse(fs.readFileSync(CAMINHO_QUESTOES, 'utf8'));
  } catch (e) {
    console.error('JSON inválido em data/questoes.json:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(questoes)) {
    console.error('data/questoes.json deve conter um array de questões.');
    process.exit(1);
  }

  const idsVistos = new Set();
  const contagemPorMateria = {};

  questoes.forEach((q, index) => {
    const ref = q.id || `índice ${index}`;

    CAMPOS_OBRIGATORIOS.forEach(campo => {
      if (q[campo] === undefined || q[campo] === null || q[campo] === '') {
        erro(erros, `[${ref}] campo obrigatório ausente ou vazio: "${campo}"`);
      }
    });

    if (q.id) {
      if (idsVistos.has(q.id)) erro(erros, `[${ref}] id duplicado: "${q.id}"`);
      idsVistos.add(q.id);
    }

    if (q.alternativas) {
      const letrasPresentes = Object.keys(q.alternativas);
      if (letrasPresentes.length !== 4 || !LETRAS.every(l => letrasPresentes.includes(l))) {
        erro(erros, `[${ref}] deve ter exatamente 4 alternativas (A, B, C, D). Encontrado: ${letrasPresentes.join(', ')}`);
      }
      LETRAS.forEach(l => {
        if (q.alternativas[l] !== undefined && String(q.alternativas[l]).trim() === '') {
          erro(erros, `[${ref}] alternativa "${l}" está vazia`);
        }
      });
    }

    if (q.respostaCorreta && !LETRAS.includes(q.respostaCorreta)) {
      erro(erros, `[${ref}] respostaCorreta inválida: "${q.respostaCorreta}" (deve ser A, B, C ou D)`);
    }

    if (q.explicacaoAlternativas && q.respostaCorreta) {
      const chavesErradas = LETRAS.filter(l => l !== q.respostaCorreta);
      chavesErradas.forEach(l => {
        if (!q.explicacaoAlternativas[l] || String(q.explicacaoAlternativas[l]).trim() === '') {
          erro(erros, `[${ref}] falta explicacaoAlternativas para a alternativa errada "${l}"`);
        }
      });
      if (q.explicacaoAlternativas[q.respostaCorreta] !== undefined) {
        erro(erros, `[${ref}] explicacaoAlternativas não deve conter a alternativa correta "${q.respostaCorreta}" (use explicacaoCorreta)`);
      }
    }

    if (q.dificuldade && !['fácil', 'média', 'difícil'].includes(q.dificuldade)) {
      erro(erros, `[${ref}] dificuldade fora do padrão esperado: "${q.dificuldade}"`);
    }

    if (q.fonte && !/edital|gird/i.test(q.fonte)) {
      erro(erros, `[${ref}] fonte não referencia nenhum documento oficial conhecido: "${q.fonte}"`);
    }

    if (q.materia) {
      contagemPorMateria[q.materia] = (contagemPorMateria[q.materia] || 0) + 1;
    }
  });

  if (questoes.length !== 50) {
    erro(erros, `Total de questões deve ser 50. Encontrado: ${questoes.length}`);
  }

  Object.entries(DISTRIBUICAO_OFICIAL).forEach(([materia, qtd]) => {
    const encontrado = contagemPorMateria[materia] || 0;
    if (encontrado !== qtd) {
      erro(erros, `Matéria "${materia}" deveria ter ${qtd} questões, encontrado ${encontrado}`);
    }
  });

  Object.keys(contagemPorMateria).forEach(materia => {
    if (!(materia in DISTRIBUICAO_OFICIAL)) {
      erro(erros, `Matéria não reconhecida na distribuição oficial: "${materia}"`);
    }
  });

  // Verifica se os arquivos-fonte citados existem na pasta /fontes (checagem best-effort pelo nome do arquivo local).
  const arquivosFontes = fs.existsSync(CAMINHO_FONTES) ? fs.readdirSync(CAMINHO_FONTES) : [];
  if (arquivosFontes.length === 0) {
    erro(erros, 'Pasta /fontes está vazia — nenhum documento-fonte local encontrado.');
  }

  console.log(`Total de questões: ${questoes.length}`);
  console.log('Distribuição encontrada por matéria:', contagemPorMateria);

  if (erros.length > 0) {
    console.error(`\n${erros.length} problema(s) encontrado(s):\n`);
    erros.forEach(e => console.error(' - ' + e));
    process.exit(1);
  }

  console.log('\nValidação concluída sem erros.');
  process.exit(0);
}

validar();

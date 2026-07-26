# Preparatório CFSd CBMMG 2026

Aplicação web (HTML + CSS + JavaScript puro, sem frameworks e sem APIs pagas) para estudo dirigido e simulado do Concurso Público para o Curso de Formação de Soldados do Corpo de Bombeiros Militar de Minas Gerais — **CFSd BM/2027**, regido pelo **Edital CBMMG nº 10, de 16 de março de 2026** (banca **IDECAN**), com prova objetiva em **26/07/2026**.

⚠️ **Antes de usar o conteúdo como definitivo, leia `RELATORIO_FONTES.md`.** Há uma divergência não resolvida: o texto integral da(s) Retificação(ões) do Edital não pôde ser obtido nesta sessão (site oficial indisponível), o que pode afetar especificamente o conteúdo de "Noções de Direitos Humanos e Legislação".

## Como executar

Como o app usa `fetch()` para carregar os arquivos JSON em `data/`, ele precisa ser servido por um servidor HTTP local (abrir `index.html` direto via `file://` não funciona em todos os navegadores por causa de CORS).

Qualquer servidor estático simples funciona, por exemplo:

```bash
# Opção 1: Python
python3 -m http.server 8000

# Opção 2: Node (http-server)
npx http-server -p 8000
```

Depois acesse `http://localhost:8000` no navegador.

## Estrutura do projeto

```
/
├── index.html                  # Estrutura principal e navegação entre áreas
├── css/style.css                # Estilo responsivo
├── js/
│   ├── app.js                   # Roteamento entre Estudo / Simulado / Desempenho
│   ├── estudo.js                 # Área de Estudo Direcionado
│   ├── simulado.js               # Área de Simulado (questão a questão)
│   ├── desempenho.js             # Área de Desempenho e resultado final
│   └── armazenamento.js          # Persistência de progresso via localStorage
├── data/
│   ├── estudos.json              # Conteúdo do Estudo Direcionado, por matéria
│   ├── questoes.json             # Banco de 50 questões do simulado
│   └── fontes.json                # Registro estruturado das fontes utilizadas
├── fontes/                       # PDFs originais das fontes oficiais usadas
├── scripts/
│   └── validar_questoes.js       # Script Node de validação de data/questoes.json
├── RELATORIO_FONTES.md           # Relatório de fontes, divergências e lacunas
└── README.md
```

## Documentos utilizados como fonte

1. **EDITAL CBMMG nº 10, de 16 de março de 2026** — Concurso Público CFSd BM/2027 (documento principal: estrutura da prova, distribuição de questões, data da prova, conteúdo programático no Anexo II).
2. **Caderno GIRD+10** (MDR/SEDEC, 2021) — fonte expressamente indicada pelo próprio Edital para a matéria "Proteção e Defesa Civil".

Detalhes completos (instituição, data, endereço de origem, data da consulta) estão em `data/fontes.json` e em `RELATORIO_FONTES.md`. Os arquivos originais estão salvos em `/fontes`.

**Não foram usadas provas anteriores do CFSd CBMMG** — nenhuma estava disponível nem foi localizada com fonte oficial verificável. Por isso, nenhuma questão ou observação deste app afirma "recorrência" de assunto baseada em provas reais; isso está declarado explicitamente em `data/estudos.json` (`avisoRecorrencia`) e no relatório de fontes.

## Como adicionar/atualizar quando sair uma retificação

1. Baixe o PDF oficial da retificação em `bombeiros.mg.gov.br` ou `idecan.org.br` e salve em `/fontes`.
2. Adicione uma entrada em `data/fontes.json`, em `fontesOficiais`, com `tipo: "Retificação"`, e remova/atualize a entrada correspondente em `documentosNaoObtidos`.
3. Se a retificação alterar conteúdo programático, distribuição de questões ou data da prova:
   - Atualize `data/estudos.json` no(s) tópico(s) afetado(s), incluindo a nova `fonte` e `pagina`.
   - Atualize `data/questoes.json` se alguma questão existente ficar desatualizada ou incorreta em função da mudança.
   - Atualize a data da prova em `js/desempenho.js` (constante `DATA_PROVA`), se for o caso.
4. Atualize `RELATORIO_FONTES.md`, registrando a retificação na seção 3 e removendo a divergência da seção 10 quando sanada.
5. Rode `node scripts/validar_questoes.js` para garantir que `data/questoes.json` continua consistente.

## Como adicionar novas questões

Cada questão em `data/questoes.json` deve seguir exatamente este formato:

```json
{
  "id": "q051",
  "materia": "Língua Portuguesa",
  "assunto": "Nome do assunto específico",
  "enunciado": "Texto do enunciado...",
  "alternativas": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "respostaCorreta": "B",
  "explicacaoCorreta": "Explicação detalhada de por que B é a alternativa correta...",
  "explicacaoAlternativas": {
    "A": "Por que A está errada...",
    "C": "Por que C está errada...",
    "D": "Por que D está errada..."
  },
  "referenciaEdital": "Trecho/tópico do Anexo II relacionado",
  "fonte": "Documento de onde o conteúdo foi extraído",
  "pagina": "Página do documento-fonte",
  "dificuldade": "média"
}
```

Regras obrigatórias:
- Sempre 4 alternativas (A a D), uma única correta.
- `explicacaoAlternativas` deve conter as 3 letras **erradas**, nunca a correta (que já tem `explicacaoCorreta`).
- `fonte` e `pagina` devem apontar para um documento **realmente verificado** — nunca invente página ou fonte.
- Nunca copie literalmente uma questão de prova real protegida por direitos autorais; baseie-se apenas no conteúdo programático oficial e, quando disponível, replique estilo/dificuldade, não o texto.
- Após adicionar questões, rode `node scripts/validar_questoes.js` para validar formato e distribuição por matéria.

## Como adicionar novos simulados/exames

O app foi construído em torno de um único simulado com 50 questões seguindo a distribuição oficial da Tabela IV do Edital. Para oferecer múltiplos simulados independentes:
- Duplique `data/questoes.json` (ex.: `data/questoes_simulado2.json`) mantendo o mesmo schema.
- Ajuste `js/simulado.js` para permitir escolher qual arquivo carregar (por exemplo, um seletor de simulado na tela inicial) e ajuste `js/armazenamento.js` para guardar o progresso de cada simulado sob uma chave própria no `localStorage`.

## Validação automática

Antes de publicar qualquer alteração no banco de questões, rode:

```bash
node scripts/validar_questoes.js
```

O script verifica: total de 50 questões, distribuição por matéria conforme o Edital, presença de todos os campos obrigatórios, 4 alternativas por questão, resposta correta válida, explicações para as 3 alternativas erradas, e presença de arquivos em `/fontes`.

## Publicar gratuitamente no GitHub Pages

1. Suba este repositório para o GitHub (se ainda não estiver lá).
2. No repositório, vá em **Settings → Pages**.
3. Em "Build and deployment", selecione **Deploy from a branch**, escolha a branch principal (ex.: `main`) e a pasta `/ (root)`.
4. Salve. Em alguns minutos o app estará disponível em `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.
5. Como o app usa apenas HTML/CSS/JS estático e `fetch` para arquivos JSON locais, nenhuma configuração de servidor adicional é necessária.

## Progresso e privacidade

Todo o progresso do simulado (respostas, acertos, erros, data de início/última atividade) é salvo **apenas no navegador do usuário**, via `localStorage` — nada é enviado a servidores externos. Para apagar o progresso, use o botão "Apagar progresso e reiniciar" disponível nas telas de Simulado/Desempenho (uma confirmação é exigida antes da exclusão).

Além do progresso do simulado atual, cada simulado **concluído** é automaticamente adicionado a um **histórico de desempenho** (também salvo apenas no navegador, chave `cfsd_cbmmg_2026_historico`), permitindo comparar a evolução do percentual de acertos ao longo de várias tentativas. Esse histórico aparece na tela de Desempenho (tabela + gráfico de evolução) a partir do segundo simulado concluído, e pode ser apagado separadamente do progresso via o botão "Apagar histórico de simulados".

## Limitações conhecidas

Ver `RELATORIO_FONTES.md`, seções "Documentos que não puderam ser obtidos" e "Divergências encontradas" — em resumo: o texto da(s) retificação(ões) do Edital não pôde ser verificado, e não há provas anteriores do CFSd CBMMG incorporadas a este material.

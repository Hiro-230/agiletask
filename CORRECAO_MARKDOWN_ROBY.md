# Correção: renderização de Markdown nas respostas do Roby

## Problema corrigido
As respostas do Roby apareciam com símbolos de Markdown bruto, como `####`, `**texto**`, listas com `-` e códigos com crase.

## Solução aplicada
Foi criado um renderizador seguro de Markdown básico diretamente em `src/app/pages/AIAssistant.tsx`, sem adicionar novas dependências ao projeto.

## O que agora é renderizado corretamente
- Títulos com `#`, `##`, `###` e `####`;
- Negrito com `**texto**`;
- Código inline com crases;
- Listas com `-`, `*`, `•` ou numeração;
- Parágrafos comuns.

## Segurança
A solução não usa `dangerouslySetInnerHTML`, então o texto gerado pela IA continua escapado pelo React, reduzindo risco de injeção de HTML.

## Validação realizada
- `npm install`: concluído;
- `npm audit`: 0 vulnerabilidades;
- `npm run build`: concluído sem erro;
- `npm run dev`: servidor iniciou e respondeu em `http://127.0.0.1:5173/`.

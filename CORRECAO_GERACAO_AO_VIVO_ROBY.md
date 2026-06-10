# Correção: geração ao vivo do Roby

Esta versão corrige o painel do Roby para não depender exclusivamente de blocos `<think>` do DeepSeek.

## O que mudou

- O painel agora mostra a geração ao vivo da resposta recebida por streaming do Ollama.
- Se o modelo enviar `<think>...</think>`, o painel mostra o processamento separado.
- Se o modelo não enviar `<think>`, o painel mostra a própria resposta sendo montada em tempo real.
- O botão foi ajustado para “Mostrar geração ao vivo” / “Ocultar geração da IA”.
- A resposta final continua limpa no chat.
- Não foi usado `dangerouslySetInnerHTML`.
- O Markdown continua renderizado corretamente.

## Arquivo alterado

- `src/app/pages/AIAssistant.tsx`

## Testes realizados

- `npm install`
- `npm audit` → 0 vulnerabilidades
- `npm run build` → build concluído com sucesso
- `npm run dev` → servidor Vite iniciado corretamente

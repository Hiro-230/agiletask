# Roby com processamento visível da IA

Esta versão adiciona uma melhoria visual no Assistente Roby para deixar a experiência mais dinâmica durante respostas abertas do DeepSeek/Ollama.

## O que foi implementado

- A chamada ao Ollama agora usa `stream: true`.
- O Roby atualiza a mensagem enquanto o DeepSeek ainda está gerando a resposta.
- Quando o modelo DeepSeek R1 gerar conteúdo em `<think>...</think>`, o AgileTask separa esse processamento da resposta final.
- Foi adicionado o botão **Mostrar processamento ao vivo** na mensagem do Roby.
- O usuário pode abrir ou fechar esse painel quando quiser.
- A resposta final continua aparecendo normalmente no chat.
- As ações rápidas do AgileTask continuam instantâneas e não dependem do DeepSeek.

## Observação

O painel mostra o processamento textual enviado pelo modelo local DeepSeek R1 via Ollama. Ele fica oculto por padrão para não poluir a interface, mas pode ser aberto durante a demonstração para mostrar que a IA está trabalhando enquanto gera a resposta.

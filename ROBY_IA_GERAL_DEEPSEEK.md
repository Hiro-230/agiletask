# Roby com IA geral via DeepSeek local

Nesta versão, o Roby foi ajustado para responder perguntas gerais usando diretamente o DeepSeek local via Ollama, sem ficar limitado somente às funcionalidades de tarefas do AgileTask.

## O que mudou

- Perguntas gerais são enviadas diretamente ao DeepSeek local.
- O prompt do sistema foi ajustado para permitir temas gerais seguros: programação, estudos, tecnologia, explicações, escrita, produtividade e dúvidas gerais.
- O Roby não deve mais se identificar como GPT-4/ChatGPT. Ele se identifica como Roby com DeepSeek/Ollama local.
- A limpeza de respostas do DeepSeek R1 foi corrigida para evitar respostas vazias quando o modelo usa tags `<think>`.
- O limite de resposta foi aumentado para reduzir respostas cortadas ou vazias.
- As ações de tarefas continuam determinísticas e seguras no código do AgileTask.

## Importante

O DeepSeek local responde texto. Quem realmente cria, edita, remove, conclui ou desmarca tarefas é o código do AgileTask. Isso evita que a IA “finja” ter feito uma alteração sem alterar os dados do aplicativo.

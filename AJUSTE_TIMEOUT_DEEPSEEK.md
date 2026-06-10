# Ajuste de tempo do DeepSeek para respostas abertas

Nesta versão, o limite de tempo das chamadas ao Ollama/DeepSeek foi aumentado para 5 minutos.

Motivo: o limite anterior era curto para perguntas abertas, principalmente quando o modelo estava carregando pela primeira vez ou quando o DeepSeek precisava gerar uma resposta mais completa.

Ajustes aplicados:

- Timeout do Ollama: 300000 ms (5 minutos)
- num_ctx: 2048
- num_predict: 520
- Remoção do stop em `<think>` para evitar corte prematuro das respostas do DeepSeek R1
- As respostas rápidas do AgileTask continuam instantâneas para tarefas, atrasadas, Kanban, resumo e prioridades

Recomendação para apresentação:

1. Antes de abrir o site, rode:
   sudo systemctl start ollama
   ollama run deepseek-r1:1.5b

2. Quando o modelo responder, pressione Ctrl + C para sair do chat do Ollama.

3. Depois execute o AgileTask:
   npm run dev

Para demonstração ao professor, use perguntas simples primeiro, como:

- Quais são minhas tarefas atrasadas?
- Resumo da semana
- Como está meu Kanban?

Depois use perguntas abertas para demonstrar o DeepSeek, como:

- O que é o DeepSeek? Fale em português.
- Me dê uma dica de produtividade para estudar programação.

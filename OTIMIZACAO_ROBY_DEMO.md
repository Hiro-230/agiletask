# Otimização do Roby para demonstração

Esta versão foi ajustada para deixar o assistente Roby mais rápido durante a apresentação.

Melhorias aplicadas:
- Perguntas comuns do AgileTask respondem instantaneamente sem depender do tempo de geração do DeepSeek.
- Comandos de tarefas continuam determinísticos: criar, editar, concluir, reabrir, excluir, atrasadas, resumo, Kanban e prioridades.
- Chamadas ao Ollama agora enviam menos histórico e menos contexto para o modelo.
- O contexto das tarefas foi resumido para evitar prompt grande.
- A resposta do DeepSeek foi limitada para reduzir tempo de geração.
- A detecção de modelos instalados no Ollama agora fica em cache por 60 segundos.
- Foi adicionado limite de tempo para evitar o Roby ficar travado esperando resposta lenta.

Comandos recomendados antes da apresentação:

```bash
sudo systemctl start ollama
ollama run deepseek-r1:1.5b
```

Depois de carregar o modelo, pressione Ctrl + C e rode o site:

```bash
npm install
npm run dev
```

Para apresentar sem travamento, use principalmente:
- "Resumo da semana"
- "Quais são minhas tarefas atrasadas?"
- "Como está meu Kanban?"
- "Crie uma tarefa de inglês para amanhã"
- "Marque essa tarefa como concluída"

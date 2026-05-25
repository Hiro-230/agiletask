# Roby em modo DeepSeek direto

Esta versão ajusta o Assistente de IA Roby para reduzir respostas inventadas do modo local/fallback.

## O que mudou

- Perguntas gerais agora vão diretamente para o DeepSeek local via Ollama.
- O Roby não usa mais respostas prontas para perguntas comuns quando a IA local está ativada.
- Ações de tarefas continuam sendo executadas pelo AgileTask, de forma determinística e segura:
  - criar tarefa;
  - remover tarefa;
  - concluir/desmarcar tarefa;
  - editar nome, categoria, data, tempo, prioridade, descrição e status.
- Se o modelo configurado não existir, o sistema tenta detectar automaticamente modelos instalados no Ollama via `/api/tags`.
- Prioridade de detecção: `deepseek-r1:1.5b`, `deepseek-r1:8b`, `deepseek-r1:7b`, `deepseek-r1:14b`, `deepseek-r1:32b`.
- Se não conseguir conectar ao Ollama, o chat mostra erro claro em vez de inventar resposta.

## Como usar

1. Rode o Ollama localmente.
2. Verifique os modelos:

```bash
ollama list
```

3. Rode o AgileTask:

```bash
npm install
npm run dev
```

4. Abra o site e acesse o Assistente de IA.

## Observação

No site publicado na Vercel, `localhost:11434` representa o computador de quem está acessando o site. Então o DeepSeek só funciona online na máquina que tiver Ollama instalado e liberado para origem externa.

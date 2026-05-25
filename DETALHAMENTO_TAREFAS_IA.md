# Nova funcionalidade: Detalhamento da tarefa com IA

Esta versão adiciona uma página individual para cada tarefa do AgileTask.

## Como funciona

- Ao clicar em uma tarefa na aba **Tarefas**, **Dashboard** ou **Kanban**, o usuário é levado para uma nova página de detalhamento.
- A página mostra nome, descrição, categoria, prioridade, prazo, tempo estimado e status.
- A página possui ações rápidas para editar, concluir/reabrir e excluir a tarefa.
- A seção **Planejamento com IA** usa o DeepSeek local via Ollama, quando disponível, para gerar:
  - objetivo da tarefa;
  - por onde começar;
  - sugestões de como fazer;
  - dicas de execução;
  - planejamento passo a passo;
  - onde terminar.
- Se o Ollama/DeepSeek não estiver disponível, o AgileTask mostra um planejamento local de fallback para não deixar a tela vazia.

## Rota adicionada

`/tarefas/:taskId`

## Arquivos principais alterados

- `src/app/routes.tsx`
- `src/app/pages/TaskDetail.tsx`
- `src/app/pages/Tasks.tsx`
- `src/app/pages/Kanban.tsx`
- `src/app/pages/Dashboard.tsx`

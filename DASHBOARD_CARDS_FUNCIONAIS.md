# Dashboard com cards funcionais

Nesta versão, os cards superiores do Dashboard deixaram de ser apenas indicadores visuais.

## Novas rotas

- `/tarefas/visao/active`: lista tarefas ativas, ou seja, tarefas que ainda não foram concluídas.
- `/tarefas/visao/done`: lista tarefas concluídas.
- `/tarefas/visao/inProgress`: lista tarefas em andamento.
- `/tarefas/visao/overdue`: lista tarefas atrasadas.
- `/tarefas/visao/high`: lista tarefas pendentes de alta prioridade.

## Comportamento

Ao clicar nos cards do Dashboard:

- **Tarefas ativas** abre a visão de tarefas pendentes e em andamento.
- **Concluídas** abre a visão de entregas finalizadas.
- **Em andamento** abre a visão de tarefas em execução.
- **Atrasadas** abre a visão de tarefas vencidas.

Dentro da nova página, cada card de tarefa pode ser clicado para abrir o detalhamento completo e o planejamento com IA.

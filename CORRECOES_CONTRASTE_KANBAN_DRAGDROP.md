# Correções de contraste e Kanban dinâmico

Esta versão corrige problemas visuais de legibilidade no Modelo 5/Zenith e adiciona movimentação real de tarefas no Kanban.

## Ajustes visuais

- Badges de prioridade agora usam classes próprias (`agile-priority-badge`) com cores fixas e alto contraste.
- Botões principais como “Nova tarefa”, “Criar Tarefa”, “Salvar Alterações” e “Gerar plano com IA” usam texto branco forçado e contraste consistente.
- Campos, labels e selects em modais receberam correção para modo escuro.
- A correção foi feita sem mudar a estrutura principal do layout.

## Kanban com arrastar e soltar

Na página Kanban, agora é possível arrastar tarefas entre as colunas:

- A Fazer
- Em andamento
- Concluídas

Ao soltar a tarefa em outra coluna, o status dela é atualizado automaticamente no contexto de tarefas e salvo no localStorage.

## Build

Build validado com:

```bash
npm run build
```

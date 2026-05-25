# Correções do Roby - Ações de tarefas

Esta versão corrige o comportamento do Assistente de IA Roby para ações reais no AgileTask.

## Corrigido

- O Roby agora reconhece comandos de remoção com: `remova`, `remove`, `remover`, `exclua`, `excluir`, `apague`, `apagar`, `deletar`, `tirar`.
- Comandos de remoção têm prioridade sobre comandos de criação. Assim, uma frase como `remova a tarefa que tem adicione...` não cria uma nova tarefa por engano.
- A busca da tarefa por nome ficou mais flexível. Exemplo: `remova a tarefa de inglês` encontra `Trabalho de inglês`.
- `remova essa tarefa` remove a tarefa mais recente criada.
- O título criado pela IA agora fica mais limpo. Exemplo: `adicione uma tarefa para quinta feira que vem: trabalho de inglês de alta prioridade, vou demorar 2 horas` cria `Trabalho de inglês`.
- O Roby também consegue concluir e atualizar tarefas simples por comando.

## Exemplos para testar

- `adicione uma tarefa para quinta feira que vem: trabalho de inglês de alta prioridade, vou demorar 2 horas`
- `remova a tarefa de inglês`
- `remova essa tarefa`
- `conclua a tarefa trabalho de inglês`
- `mude a prioridade da tarefa trabalho de inglês para baixa`

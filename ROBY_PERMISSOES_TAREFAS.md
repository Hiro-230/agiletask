# Roby — Permissões de tarefas

Nesta versão, o Roby executa ações reais no sistema AgileTask antes de consultar o DeepSeek. Isso evita que o modelo invente respostas ou apenas converse sem alterar os dados.

## Ações permitidas

O Roby pode fazer as mesmas operações principais que o usuário faz manualmente na tela de tarefas:

- Criar tarefa
- Remover/excluir tarefa
- Concluir tarefa
- Editar tarefa
- Alterar nome/título
- Alterar categoria
- Alterar data/prazo
- Alterar tempo estimado
- Alterar prioridade
- Alterar descrição
- Alterar status: A fazer, Em andamento ou Concluída

## Proteção de dados

O Roby bloqueia comandos que tentem salvar informações confidenciais em tarefas, como:

- Senhas, tokens e chaves de API
- E-mails
- Telefones
- CPF, RG ou documentos
- Endereços
- Dados bancários, PIX ou cartão
- Comandos explícitos para salvar nomes/dados pessoais

## Exemplos de comandos

Criar tarefa:

```text
adicione uma tarefa para quinta feira que vem: trabalho de inglês de alta prioridade, vou demorar 2 horas
```

Remover tarefa:

```text
remova a tarefa de inglês
```

Concluir tarefa:

```text
conclua a tarefa trabalho de inglês
```

Editar prioridade:

```text
mude a prioridade da tarefa trabalho de inglês para baixa
```

Editar data:

```text
altere a data da tarefa trabalho de inglês para amanhã
```

Editar tempo:

```text
mude o tempo da tarefa trabalho de inglês para 30 minutos
```

Editar categoria:

```text
mude a categoria da tarefa trabalho de inglês para Estudos
```

Editar descrição:

```text
mude a descrição da tarefa trabalho de inglês para revisar as páginas 10 a 15
```

Renomear tarefa:

```text
renomeie a tarefa trabalho de inglês para prova de inglês
```

Alterar status:

```text
coloque a tarefa trabalho de inglês em andamento
```

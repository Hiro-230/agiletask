# Roby — lógica de agente corrigida

Esta versão corrige a interpretação de comandos do Roby para ações reais no AgileTask.

## Correções principais

- O Roby agora entende comandos de **desmarcar tarefa concluída**:
  - "desmarque a tarefa de inglês"
  - "não terminei a tarefa de inglês"
  - "ainda não terminei a tarefa de escolher a paleta de cores"
  - "volte a tarefa para pendente"
  - "coloque a tarefa como a fazer"

- Frases negativas como **"não terminei"** não são mais confundidas com **"concluir"**.
- O comando **tirar/remover de concluída** não exclui mais a tarefa por engano; ele muda o status para **A Fazer**.
- O Roby memoriza a última tarefa manipulada para entender comandos como **"essa tarefa"**.
- A busca por tarefa ficou mais tolerante, aceitando trechos parecidos do nome.
- As ações diretas de tarefa continuam sendo executadas pelo código do AgileTask, não pelo texto livre do DeepSeek.

## Permissões mantidas

O Roby pode:

- criar tarefa;
- excluir/remover tarefa;
- marcar como concluída;
- desmarcar como concluída;
- editar título/nome;
- editar categoria;
- editar prazo/data;
- editar tempo estimado;
- editar prioridade;
- editar descrição;
- alterar status para A Fazer, Em Andamento ou Concluída.

## Segurança

O Roby continua bloqueando comandos que tentam salvar dados confidenciais em tarefas, como senhas, e-mails, CPF, RG, telefone, endereço, PIX, dados bancários, tokens e chaves de API.

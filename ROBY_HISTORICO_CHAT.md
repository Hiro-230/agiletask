# Histórico do chat do Roby

Nesta versão, o histórico de mensagens do Assistente de IA Roby passou a ser salvo no `localStorage` do navegador.

## O que mudou

- As mensagens não somem mais ao sair da aba do Assistente de IA.
- O histórico permanece ao navegar entre Dashboard, Tarefas, Kanban e Configurações.
- O histórico também permanece ao atualizar a página.
- O botão **Reiniciar** continua limpando a conversa e reiniciando com a mensagem inicial do Roby.
- Para evitar excesso de dados no navegador, o sistema mantém as últimas 120 mensagens.

## Observação de segurança

O histórico fica salvo apenas localmente no navegador do usuário. Ele não é enviado para servidor externo pelo AgileTask.

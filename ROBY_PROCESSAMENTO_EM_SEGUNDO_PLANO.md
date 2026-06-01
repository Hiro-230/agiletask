# Roby em segundo plano

Nesta versão, o Assistente de IA Roby mantém o histórico, o estado de carregamento e a requisição ao DeepSeek/Ollama em um estado global do aplicativo.

Isso evita que a resposta seja perdida quando o usuário sai da página do Assistente de IA durante uma pergunta. Ao voltar para a aba Roby IA, a resposta continua aparecendo normalmente.

Observação: se o usuário clicar em **Reiniciar**, a conversa atual é limpa e qualquer resposta antiga em andamento é ignorada por segurança.

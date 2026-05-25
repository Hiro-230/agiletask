# Correções de fluidez, botões e planejamento por IA

Esta versão corrige os pontos observados nos testes do layout Modelo 5 / Zenith.

## Ajustes realizados

- Redução de animações e efeitos pesados de blur para melhorar fluidez.
- Transições de página simplificadas para evitar travamentos em notebooks.
- Botão flutuante global **Nova tarefa** no canto inferior direito, garantindo acesso mesmo quando algum botão do hero estiver fora da área visível.
- Modal de criação/edição ajustado com altura máxima, rolagem interna e rodapé visível.
- Página de detalhamento da tarefa não fica mais presa em **Gerando...**.
- Planejamento local aparece imediatamente para evitar tela vazia.
- Geração com DeepSeek/Ollama agora possui timeout de 25 segundos; se a IA demorar, o app mantém um plano local e libera a interface.
- Prompt de planejamento reduzido para respostas mais rápidas.
- Build validado com `npm run build`.

## Observação sobre IA local

Se o Ollama/DeepSeek estiver lento ou não responder, o AgileTask não trava mais a página. Ele usa o planejamento local como fallback.

# Correção do Planejamento com IA

Esta versão corrige a funcionalidade de planejamento da página de detalhamento de tarefa.

## O que foi corrigido

- O botão **Gerar plano com IA** agora chama o Ollama/DeepSeek de verdade.
- A chamada usa streaming, então o planejamento aparece aos poucos enquanto a IA responde.
- O timeout foi aumentado para 120 segundos, evitando fallback prematuro em máquinas onde o DeepSeek 8B é mais lento.
- O sistema detecta automaticamente o modelo instalado no Ollama quando o modelo salvo não existe.
- Se o Ollama estiver desligado, com CORS bloqueado ou sem modelo instalado, o sistema mostra erro claro e mantém um plano local para a página não travar.
- O plano gerado pelo DeepSeek é salvo no localStorage com fonte **DeepSeek**.

## Requisitos para a IA local funcionar

1. Ollama em execução.
2. Modelo DeepSeek instalado, por exemplo:
   ```bash
   ollama list
   ```
3. Modelo recomendado para velocidade:
   ```bash
   deepseek-r1:1.5b
   ```
4. Modelo recomendado para qualidade:
   ```bash
   deepseek-r1:8b
   ```
5. Se acessar pela Vercel, o computador do usuário precisa ter Ollama local e liberar origem:
   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```

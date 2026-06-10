# Correção do processamento do modelo no Roby

Esta versão corrige o painel de processamento do Roby para funcionar de forma mais próxima ao terminal do Ollama/DeepSeek.

## O que foi ajustado

- O chat continua exibindo a resposta final limpa.
- O painel “Mostrar processamento do modelo” passa a capturar o raciocínio separado quando o Ollama enviar `message.thinking` ou `thinking`.
- Também continua compatível com modelos que retornam raciocínio em `<think>...</think>`.
- Foi adicionado suporte ao formato textual usado por alguns clientes/modelos: `Thinking...` até `...done thinking.`.
- Se o modelo não enviar raciocínio separado, o painel ainda mostra a geração ao vivo da resposta final.
- Build e auditoria foram validados.

## Testes realizados

```bash
npm audit
npm run build
```

Resultado esperado:

```text
found 0 vulnerabilities
✓ built
```

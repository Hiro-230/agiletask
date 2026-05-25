# Correção de performance — AgileTask Modelo 5

Esta versão reduz travamentos/engasgos causados por efeitos visuais pesados.

## Ajustes aplicados

- Removida a transição animada global entre páginas no `Layout.tsx`.
- Removida a linha animada de sprint no topo da tela.
- Reduzido o uso de `backdrop-filter` e `blur`, que pesavam bastante no Chrome/Linux.
- Reduzidas sombras grandes em cards, painéis e hero.
- Reduzido tempo de transição global para 80ms.
- Mantido o layout Modelo 5/Zenith, mas com efeitos mais leves.
- Mantida a correção de contraste dos botões e do Assistente de IA.

## Observação

O visual continua premium, mas agora com prioridade em fluidez. Caso queira ainda mais desempenho em notebooks fracos, use o modo claro/escuro sem muitos efeitos e evite deixar muitas abas do navegador abertas junto com o Ollama.

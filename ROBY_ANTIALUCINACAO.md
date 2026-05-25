# Correção anti-alucinação do Roby

Esta versão melhora o comportamento do Assistente de IA Roby em perguntas gerais e básicas.

## Alterações

- Perguntas de identidade como "qual seu nome?" agora são respondidas pelo próprio app, sem depender do modelo local.
- O Roby consegue memorizar o nome informado pelo usuário no navegador, por exemplo: "meu nome é Gabriel".
- Perguntas como "qual o meu nome?" usam essa memória local; se o usuário não informou, o Roby não inventa.
- Perguntas sobre qual IA/modelo está sendo usado são respondidas com base na configuração real do app.
- Respostas do DeepSeek R1 passam por limpeza para remover tags `<think>`, HTML e trechos visuais indevidos.
- O prompt do modelo foi reforçado para responder em português, sem HTML e sem inventar dados pessoais.
- A temperatura do modelo foi reduzida para diminuir respostas aleatórias.

## Observação importante

Modelos pequenos, como `deepseek-r1:1.5b`, são rápidos, mas podem errar mais em perguntas gerais. Para melhor qualidade, use `deepseek-r1:8b` nas Configurações > IA & API.

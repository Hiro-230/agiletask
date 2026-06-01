# Cores livres em Configurações > Aparência

Esta versão adiciona um editor livre de cores na aba **Configurações > Aparência**.

## O que foi implementado

- Edição livre da cor principal.
- Edição livre da cor secundária.
- Edição livre da cor de fundo do site.
- Edição livre da cor de cards/painéis.
- Aplicação em tempo real, sem precisar recarregar a página.
- Salvamento no `localStorage` do navegador.
- Validação de hexadecimal para evitar quebrar o tema.
- Ajuste automático de contraste em textos principais, botões e superfícies.
- Botão **Restaurar** para voltar ao padrão seguro.

## Segurança visual

O sistema só aplica a cor ao site quando o valor está em formato hexadecimal válido, por exemplo:

```text
#7c3aed
#06b6d4
#020617
```

Isso evita bug visual quando o usuário digita uma cor incompleta.

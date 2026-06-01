# Barra de perfil/status funcional

A barra de perfil da sidebar deixou de ser apenas visual.

## O que mudou

- Ao clicar no card com foto, nome e status, o usuário é levado para `Configurações > Perfil`.
- O status exibido na sidebar agora pode ser alterado nas configurações.
- Status disponíveis:
  - Online agora
  - Em foco
  - Ocupado
  - Offline
- A alteração é aplicada imediatamente na sidebar e salva no `localStorage`.
- Nome e foto continuam sincronizando automaticamente com a sidebar.

## Persistência

Os dados são salvos nas chaves:

- `@AgileTask:name`
- `@AgileTask:profilePhoto`
- `@AgileTask:profileStatus`

Isso mantém o comportamento compatível com o protótipo local e com a versão publicada na Vercel.

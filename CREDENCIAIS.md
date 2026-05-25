# 🔐 Credenciais de Acesso - AgileTask

## Login Padrão

Para fazer login pela primeira vez, você pode usar qualquer uma das opções:

### Opção 1 — Login com Google do protótipo
Clique em **Entrar com Google**. O sistema entra automaticamente na conta demonstrativa, sem precisar digitar e-mail e senha.

> Observação: neste protótipo acadêmico, o botão Google simula uma autenticação para facilitar a apresentação. Para produção real, é necessário configurar OAuth com Firebase Auth, Supabase Auth ou Google Cloud.

### Opção 2 — Login manual
- **E-mail:** `estefani@exemplo.com`
- **Senha:** `123456`

## Criar Nova Conta

Você pode criar uma nova conta usando a opção **Criar conta grátis** na tela de login.

## Alterar Perfil e Senha

1. Faça login no sistema
2. Acesse **Configurações** no menu lateral
3. Vá na aba **Perfil**
4. Altere nome, e-mail, função ou senha
5. Clique em **Salvar Alterações**

## Funcionalidades Corrigidas

### ✅ 1. Perfil funcional
- O botão **Trocar foto** agora abre o seletor de imagem.
- A foto é salva localmente no navegador.
- A imagem aparece no perfil e no avatar mobile.
- Arquivos que não são imagem são bloqueados.
- Imagens maiores que 3 MB são recusadas para evitar travamentos no localStorage.

### ✅ 2. Autenticação em dois fatores funcional
- O botão **Ativar** agora muda o estado da autenticação em dois fatores.
- Ao ativar, o sistema gera um código demonstrativo de 6 dígitos.
- O botão muda para **Desativar** quando o recurso está ligado.
- O estado é salvo em localStorage.
- No login, quando o 2FA estiver ativado, o sistema pede o código antes de entrar.

> Observação: esta é uma implementação demonstrativa para protótipo acadêmico. Para produção real, o 2FA deve usar backend, envio por e-mail/SMS/app autenticador e validação segura no servidor.

### ✅ 3. IA Roby sem erro de créditos na interface
- O Roby funciona em **modo inteligente local**, sem consumir créditos.
- A API online do DeepSeek é opcional.
- Se a API online retornar erro, o Roby responde automaticamente usando o modo local.
- A mensagem antiga de “créditos insuficientes” não aparece mais para o usuário.

> Observação: o modelo DeepSeek pode ser aberto, mas a API hospedada oficial cobra por uso e pode retornar erro de saldo insuficiente. Para usar sem custo de API, seria necessário rodar um modelo local ou usar apenas o modo inteligente local do protótipo.

### ✅ 4. Aparência corrigida
- O tema escuro agora cobre toda a página principal.
- Textos no modo escuro receberam mais contraste.
- Cards, inputs, bordas, abas e áreas internas foram ajustados para modo escuro.
- Os seletores de cor de destaque foram corrigidos: os dois primeiros botões não mudam mais junto com a cor selecionada.
- Tema, cor de destaque e tamanho da fonte agora são aplicados imediatamente ao clicar.

### ✅ 5. Gerenciamento de dados funcional
- Exporta dados em JSON.
- Apaga todos os dados do AgileTask após confirmação.
- Recarrega a página automaticamente após limpar os dados.

### ✅ 6. Busca do Dashboard funcional
- A barra **Buscar tarefas...** agora filtra tarefas por título, descrição, categoria, prioridade, status, tempo estimado e data.
- A busca mostra os resultados diretamente na área principal do Dashboard.
- O botão de limpar busca aparece quando há texto digitado.

### ✅ 7. Login com Google funcional para protótipo
- O botão **Entrar com Google** agora faz login sem exigir preenchimento manual de e-mail e senha.
- O usuário é redirecionado automaticamente para o Dashboard.
- A sessão fica salva no `localStorage`, igual ao login comum.

---

**Desenvolvido com ❤️ para produtividade máxima!**

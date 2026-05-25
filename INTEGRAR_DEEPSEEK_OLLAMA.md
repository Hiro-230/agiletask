# Integração do AgileTask com DeepSeek local via Ollama

Esta versão do AgileTask já chama o DeepSeek local pelo Ollama na aba **Assistente de IA**.

## 1. Confira se o Ollama está rodando

No terminal:

```bash
ollama list
```

Se aparecer o modelo `deepseek-r1:8b`, está tudo certo.

Se você baixou outro modelo, veja o nome exato nessa lista e configure o mesmo nome em:

**Configurações > IA & API > Modelo de IA instalado**

## 2. Baixar o modelo recomendado

```bash
ollama pull deepseek-r1:8b
```

Ou, se o computador ficar pesado:

```bash
ollama pull deepseek-r1:7b
```

Ou muito leve:

```bash
ollama pull deepseek-r1:1.5b
```

## 3. Testar direto no terminal

```bash
ollama run deepseek-r1:8b
```

Digite uma pergunta. Se ele responder, o modelo local está funcionando.

## 4. Rodar o AgileTask

Dentro da pasta do projeto:

```bash
npm install
npm run dev
```

Abra o link mostrado pelo Vite, normalmente:

```text
http://localhost:5173/
```

## 5. Configuração dentro do AgileTask

No app, vá em:

**Configurações > IA & API**

Use:

```text
Endereço local do Ollama: http://localhost:11434
Modelo: deepseek-r1:8b
Usar IA real local: ligado
```

Depois clique em **Salvar alterações**.

## 6. Se der erro de conexão

Teste:

```bash
curl http://localhost:11434/api/tags
```

Se não responder, reinicie o Ollama:

```bash
sudo systemctl restart ollama
```

Depois rode o site de novo.

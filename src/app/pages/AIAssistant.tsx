import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useTasks, Task } from "../context/TaskContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  time: string;
  thinking?: string;
  generation?: string;
  isStreaming?: boolean;
  model?: string;
}


function renderInlineMarkdown(text: string) {
  const nodes: Array<string | JSX.Element> = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-bold text-slate-50">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`code-${match.index}`} className="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[0.92em] text-cyan-100">
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function RobyMarkdownMessage({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: JSX.Element[] = [];
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];

  const flushUnorderedList = () => {
    if (!unorderedItems.length) return;
    const items = unorderedItems;
    unorderedItems = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5 text-slate-100">
        {items.map((item, index) => (
          <li key={`ul-item-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
  };

  const flushOrderedList = () => {
    if (!orderedItems.length) return;
    const items = orderedItems;
    orderedItems = [];
    blocks.push(
      <ol key={`ol-${blocks.length}`} className="my-2 list-decimal space-y-1 pl-5 text-slate-100">
        {items.map((item, index) => (
          <li key={`ol-item-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>,
    );
  };

  const flushLists = () => {
    flushUnorderedList();
    flushOrderedList();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushLists();
      return;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (heading) {
      flushLists();
      const level = Math.min(heading[1].length, 4);
      const text = heading[2].trim();
      const className =
        level === 1
          ? "mt-3 mb-2 text-lg font-extrabold text-slate-50"
          : level === 2
            ? "mt-3 mb-2 text-base font-extrabold text-slate-50"
            : "mt-3 mb-1.5 text-sm font-extrabold text-slate-50";

      blocks.push(
        <div key={`heading-${blocks.length}`} className={className}>
          {renderInlineMarkdown(text)}
        </div>,
      );
      return;
    }

    const unordered = line.match(/^\s{0,3}[-*•]\s+(.+)$/);
    if (unordered) {
      flushOrderedList();
      unorderedItems.push(unordered[1].trim());
      return;
    }

    const ordered = line.match(/^\s{0,3}\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushUnorderedList();
      orderedItems.push(ordered[1].trim());
      return;
    }

    flushLists();
    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-2 text-slate-100 last:mb-0">
        {renderInlineMarkdown(line.trim())}
      </p>,
    );
  });

  flushLists();

  return <div className="break-words">{blocks}</div>;
}

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "deepseek-r1:1.5b";

const ROBY_USER_MEMORY_KEY = "@AgileTask:robyUserMemory";

interface RobyUserMemory {
  name?: string;
}

function loadUserMemory(): RobyUserMemory {
  try {
    const raw = localStorage.getItem(ROBY_USER_MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserMemory(memory: RobyUserMemory) {
  try {
    localStorage.setItem(ROBY_USER_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // localStorage pode estar bloqueado em alguns navegadores.
  }
}

function extractUserNameFromMessage(input: string): string | null {
  const text = input.trim();
  const normalized = removeAccents(text.toLowerCase());

  if (normalized.includes("?") || /\b(qual|quem|como)\b/.test(normalized)) return null;

  const patterns = [
    /\bmeu\s+nome\s+(?:é|e|eh)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,45})/i,
    /\beu\s+sou\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,45})/i,
    /\bme\s+chamo\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,45})/i,
    /\bpode\s+me\s+chamar\s+de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,45})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const candidate = sanitizeTextValue(match[1])
      .replace(/\b(eu|sou|quero|preciso|gostaria|estou|tenho|minha|meu)\b.*$/i, "")
      .trim();
    if (candidate.length >= 2 && candidate.length <= 45) return candidate;
  }

  return null;
}

function getDeterministicGeneralAnswer(input: string, tasks: Task[], selectedModel: string): string | null {
  const normalized = normalizeForSearch(input);
  const memory = loadUserMemory();
  const pending = tasks.filter((task) => task.status !== "done").length;

  const nameInMessage = extractUserNameFromMessage(input);
  if (nameInMessage) {
    saveUserMemory({ ...memory, name: nameInMessage });
    return `Prazer, ${nameInMessage}! Vou lembrar seu nome neste navegador enquanto você usar o AgileTask.`;
  }

  if (/\b(qual|quem)\b.*\b(seu|sua)\b.*\bnome\b/.test(normalized) || normalized === "seu nome") {
    return `Meu nome é Roby. Sou o assistente de IA do AgileTask e estou conectado ao DeepSeek local pelo Ollama, usando o modelo ${selectedModel}.`;
  }

  if (/\b(qual|quem)\b.*\b(meu|minha)\b.*\bnome\b/.test(normalized) || normalized === "meu nome") {
    if (memory.name) return `Seu nome é ${memory.name}.`;
    return "Eu ainda não sei seu nome. Se quiser, diga: \"meu nome é Gabriel\".";
  }

  if (
    normalized.includes("qual ia") ||
    normalized.includes("que ia") ||
    normalized.includes("qual inteligencia artificial") ||
    normalized.includes("qual modelo") ||
    normalized.includes("modelo voce usa") ||
    normalized.includes("ia voce usa")
  ) {
    return `Eu sou o Roby, assistente do AgileTask. Para respostas gerais, uso o DeepSeek local via Ollama. O modelo configurado agora é ${selectedModel}. Para ações de tarefas, uso funções seguras do próprio AgileTask.`;
  }

  if (/^(oi|ola|olá|e ai|e aí|bom dia|boa tarde|boa noite)\b/.test(normalized)) {
    return `Olá! Sou o Roby. Posso responder perguntas gerais e também ajudar com suas tarefas. Você tem ${pending} tarefa(s) pendente(s).`;
  }

  return null;
}

const API_ONLY_DEEPSEEK_MODELS = new Set([
  "deepseek-chat",
  "deepseek-reasoner",
  "deepseek-coder",
  "deepseek-v3",
]);

function normalizeOllamaModel(value?: string | null): string {
  const model = (value || "").trim();

  // Modelos como deepseek-chat/deepseek-reasoner são nomes da API online da DeepSeek,
  // não do Ollama local. Para evitar erro no navegador com configuração antiga salva,
  // migramos automaticamente para o modelo que o usuário instalou localmente.
  if (!model || API_ONLY_DEEPSEEK_MODELS.has(model)) {
    localStorage.setItem("@AgileTask:aiModel", DEFAULT_OLLAMA_MODEL);
    return DEFAULT_OLLAMA_MODEL;
  }

  return model;
}

function normalizeOllamaUrl(value?: string | null): string {
  const url = (value || "").trim().replace(/\/$/, "");
  const finalUrl = url || DEFAULT_OLLAMA_URL;
  localStorage.setItem("@AgileTask:ollamaUrl", finalUrl);
  return finalUrl;
}

const buildCompactTaskContext = (tasks: Task[]): string => {
  const sortedTasks = [...tasks]
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 8);

  const lines = sortedTasks.map((t) => {
    const status = t.status === "done" ? "Concluída" : t.status === "inProgress" ? "Em andamento" : "A fazer";
    return `- ${t.title} | ${status} | ${t.priority} | ${t.date}`;
  });

  return lines.join("\n") || "Nenhuma tarefa cadastrada.";
};

const systemPrompt = (
  tasks: Task[],
  selectedModel: string,
) => `Você é o Roby, assistente do AgileTask, usando ${selectedModel} via Ollama local.
Responda sempre em português brasileiro, de forma curta, direta e útil.

Regras:
- Para modelos DeepSeek R1, se você gerar processamento interno, envie esse processamento separado em <think>...</think> e mantenha a resposta final fora desse bloco.
- Não use HTML, JSX ou CSS. Markdown básico é permitido.
- Não diga que é ChatGPT; sua identidade aqui é Roby.
- Se a pergunta envolver o app, use o contexto resumido abaixo.
- Ações de criar, editar, concluir, reabrir ou excluir tarefas são executadas pelo próprio AgileTask; não finja executar ações.
- Nunca peça nem repita senhas, tokens, documentos, endereço completo, telefone, e-mail ou dados confidenciais.

Resumo das tarefas:
Total: ${tasks.length}. Concluídas: ${tasks.filter((t) => t.status === "done").length}. Pendentes: ${tasks.filter((t) => t.status !== "done").length}.
${buildCompactTaskContext(tasks)}`;


function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateBr(dateIso: string): string {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString("pt-BR");
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeForSearch(value: string): string {
  return removeAccents(value.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeTextValue(value: string): string {
  return value
    .replace(/["'“”]/g, " ")
    .replace(/^[\s:;,\.\-–—=]+|[\s:;,\.\-–—=]+$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FIELD_BOUNDARY_PATTERN = /\s+(?:e\s+)?\b(?:titulo|título|nome|categoria|tipo|area|área|data|prazo|tempo|tempo estimado|duracao|duração|prioridade|periodade|descri[cç][aã]o|descricao|status|situa[cç][aã]o)\b[\s:=]/i;

function trimAtNextField(value: string): string {
  return sanitizeTextValue(value.replace(FIELD_BOUNDARY_PATTERN, " "));
}

function detectSensitiveData(input: string): string | null {
  const lower = input.toLowerCase();
  const normalized = normalizeForSearch(input);

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(input)) return "e-mail";
  if (/\b(senha|password|token|api\s*key|chave\s+api|segredo|secret)\b/i.test(lower)) return "senha, token ou chave";
  if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(input)) return "CPF";
  if (/\b\d{2}\.?\d{3}\.?\d{3}-?\d{1}\b/.test(input)) return "RG/documento";
  if (/\b(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}\b/.test(input)) return "telefone";
  if (/\b(cartao|cartão|pix|chave pix|banco|agencia|agência|conta bancaria|conta bancária)\b/i.test(lower)) return "dado financeiro";
  if (/\b(endereco|endereço|rua|avenida|av\.?|numero da casa|número da casa|cep)\b/i.test(lower)) return "endereço";
  if (/\b(nome da pessoa|nome do cliente|nome da cliente|pessoa chamada|cliente chamado|cliente chamada|aluno chamado|aluna chamada)\b/i.test(lower)) return "nome de pessoa";

  // Evita salvar comandos explicitamente orientados a guardar dados pessoais.
  if (normalized.includes("dados pessoais") || normalized.includes("informacao pessoal") || normalized.includes("informacoes pessoais")) {
    return "dados pessoais";
  }

  return null;
}

function buildPrivacyRefusal(reason: string): string {
  return `Por segurança, não vou salvar ${reason} dentro das tarefas. Posso criar ou editar tarefas com informações gerais, como título, categoria, data, tempo estimado, prioridade, status e descrição sem dados confidenciais.`;
}

function parseRequestedDate(input: string): string {
  const msg = removeAccents(input.toLowerCase());
  const date = new Date();
  date.setHours(12, 0, 0, 0);

  const isoMatch = input.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const parsed = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (!Number.isNaN(parsed.getTime())) return toLocalISODate(parsed);
  }

  const brMatch = input.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (brMatch) {
    const d = Number(brMatch[1]);
    const m = Number(brMatch[2]);
    let y = brMatch[3] ? Number(brMatch[3]) : date.getFullYear();
    if (y < 100) y += 2000;
    const parsed = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (!Number.isNaN(parsed.getTime()) && parsed.getDate() === d && parsed.getMonth() === m - 1) {
      return toLocalISODate(parsed);
    }
  }

  if (msg.includes("depois de amanha")) {
    date.setDate(date.getDate() + 2);
    return toLocalISODate(date);
  }

  if (msg.includes("amanha")) {
    date.setDate(date.getDate() + 1);
    return toLocalISODate(date);
  }

  if (msg.includes("hoje")) {
    return toLocalISODate(date);
  }

  if (msg.includes("semana que vem") || msg.includes("proxima semana")) {
    date.setDate(date.getDate() + 7);
    return toLocalISODate(date);
  }

  const weekdays: Array<{ names: string[]; day: number }> = [
    { names: ["domingo"], day: 0 },
    { names: ["segunda", "segunda feira"], day: 1 },
    { names: ["terca", "terca feira"], day: 2 },
    { names: ["quarta", "quarta feira"], day: 3 },
    { names: ["quinta", "quinta feira"], day: 4 },
    { names: ["sexta", "sexta feira"], day: 5 },
    { names: ["sabado"], day: 6 },
  ];

  const found = weekdays.find((weekday) =>
    weekday.names.some((name) => msg.includes(name)),
  );

  if (found) {
    let delta = found.day - date.getDay();
    if (delta <= 0 || msg.includes("que vem") || msg.includes("proxima") || msg.includes("proximo")) delta += 7;
    date.setDate(date.getDate() + delta);
    return toLocalISODate(date);
  }

  return toLocalISODate(date);
}

function parseEstimatedTime(input: string): string {
  const msg = removeAccents(input.toLowerCase()).replace(/,/g, ".");
  const hourMatch = msg.match(/(\d+(?:\.\d+)?)\s*(?:h|hora|horas)\b/);
  const minuteMatch = msg.match(/(\d+)\s*(?:min|mins|minuto|minutos)\b/);

  if (hourMatch) {
    const value = Number(hourMatch[1]);
    if (!Number.isNaN(value)) {
      const hours = Math.floor(value);
      const decimalMinutes = Math.round((value - hours) * 60);
      const extraMinutes = minuteMatch ? Number(minuteMatch[1]) : 0;
      const minutes = decimalMinutes + (Number.isNaN(extraMinutes) ? 0 : extraMinutes);
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
      if (hours > 0) return `${hours}h`;
      if (minutes > 0) return `${minutes}min`;
    }
  }

  if (minuteMatch) return `${minuteMatch[1]}min`;

  return "1h";
}

function parsePriority(input: string): Task["priority"] {
  const msg = removeAccents(input.toLowerCase());
  if (msg.includes("alta") || msg.includes("urgente") || msg.includes("importante")) {
    return "Alta";
  }
  if (msg.includes("baixa") || msg.includes("tranquila") || msg.includes("simples")) {
    return "Baixa";
  }
  return "Média";
}

function normalizePriority(value: string): Task["priority"] | undefined {
  const msg = normalizeForSearch(value);
  if (msg.includes("alta") || msg.includes("urgente") || msg.includes("importante")) return "Alta";
  if (msg.includes("media") || msg.includes("medio") || msg.includes("normal")) return "Média";
  if (msg.includes("baixa") || msg.includes("tranquila") || msg.includes("simples")) return "Baixa";
  return undefined;
}

function normalizeStatus(value: string): Task["status"] | undefined {
  const msg = normalizeForSearch(value);

  // Primeiro tratamos negações e comandos de "desconcluir".
  // Antes, frases como "não terminei" ou "desmarque como concluída" podiam cair em "Concluída"
  // só por conterem a palavra concluída/terminei.
  const wantsTodo =
    msg.includes("desmarcar") ||
    msg.includes("desmarque") ||
    msg.includes("desmarca") ||
    msg.includes("desfazer conclusao") ||
    msg.includes("retirar de concluida") ||
    msg.includes("tirar de concluida") ||
    msg.includes("voltar para pendente") ||
    msg.includes("voltar para a fazer") ||
    msg.includes("a fazer") ||
    msg.includes("pendente") ||
    /\b(?:nao|nunca)\s+(?:terminei|conclui|completei|finalizei|fiz)\b/.test(msg) ||
    /\bainda\s+(?:nao|nunca)\s+(?:terminei|conclui|completei|finalizei|fiz)\b/.test(msg) ||
    /\b(?:nao|nunca)\s+esta\s+(?:concluida|concluido|feita|feito|finalizada|finalizado)\b/.test(msg);

  if (wantsTodo) return "todo";
  if (msg.includes("andamento") || msg.includes("fazendo") || msg.includes("iniciar") || msg.includes("comecar") || msg.includes("in progress")) return "inProgress";
  if (msg.includes("concluida") || msg.includes("concluido") || msg.includes("finalizada") || msg.includes("finalizado") || msg.includes("terminei") || msg.includes("feito") || msg.includes("done")) return "done";
  if (msg.includes("todo") || msg.includes("voltar")) return "todo";
  return undefined;
}

function parseCategory(input: string): string {
  const msg = removeAccents(input.toLowerCase());
  if (
    msg.includes("ingles") ||
    msg.includes("prova") ||
    msg.includes("estudo") ||
    msg.includes("faculdade") ||
    msg.includes("universidade") ||
    msg.includes("escola") ||
    msg.includes("aula")
  ) {
    return "Estudos";
  }
  if (msg.includes("reuniao") || msg.includes("cliente")) return "Reunião";
  if (msg.includes("design") || msg.includes("figma")) return "Design";
  if (msg.includes("codigo") || msg.includes("programacao") || msg.includes("sistema") || msg.includes("dev")) return "Desenvolvimento";
  if (msg.includes("pessoal") || msg.includes("casa")) return "Pessoal";
  if (msg.includes("trabalho") || msg.includes("projeto")) return "Trabalho";
  return "Geral";
}

function normalizeCategory(value: string): string {
  const clean = sanitizeTextValue(value);
  const msg = normalizeForSearch(clean);
  if (!msg) return "Geral";
  if (msg.includes("estudo") || msg.includes("escola") || msg.includes("faculdade") || msg.includes("universidade") || msg.includes("prova") || msg.includes("ingles")) return "Estudos";
  if (msg.includes("trabalho") || msg.includes("servico") || msg.includes("projeto")) return "Trabalho";
  if (msg.includes("design") || msg.includes("figma")) return "Design";
  if (msg.includes("reuniao") || msg.includes("cliente")) return "Reunião";
  if (msg.includes("pessoal") || msg.includes("casa")) return "Pessoal";
  if (msg.includes("desenvolvimento") || msg.includes("programacao") || msg.includes("codigo")) return "Desenvolvimento";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const SEARCH_STOP_WORDS = new Set([
  "a", "o", "os", "as", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "para", "pra", "por", "com", "sem", "em", "no", "na", "nos", "nas", "que", "tem",
  "tarefa", "tarefas", "atividade", "atividades", "compromisso", "compromissos", "essa", "esta",
  "esse", "este", "aquela", "aquele", "minha", "meu", "seu", "sua", "roby", "favor",
  "editar", "edite", "alterar", "altere", "mudar", "mude", "trocar", "troque", "atualizar", "atualize",
  "titulo", "título", "nome", "categoria", "tipo", "area", "área", "data", "prazo", "tempo",
  "estimado", "duracao", "duração", "prioridade", "periodade", "descricao", "descrição", "status",
  "alta", "media", "média", "baixa", "urgente", "importante", "hoje", "amanha", "amanhã",
  "segunda", "terca", "terça", "quarta", "quinta", "sexta", "sabado", "sábado", "domingo",
  "hora", "horas", "min", "mins", "minuto", "minutos", "chamada", "chamado",
  "desmarcar", "desmarque", "desmarca", "desfazer", "desfaca", "desfaça", "nao", "não", "nunca",
  "ainda", "terminei", "conclui", "completei", "finalizei", "finalizada", "finalizado", "feito", "feita",
  "pendente", "voltar", "volte", "retirar", "retire", "marcada", "marcado",
]);

function searchWords(value: string): string[] {
  return normalizeForSearch(value)
    .split(" ")
    .filter((word) => word.length >= 3 && !SEARCH_STOP_WORDS.has(word));
}

function stripActionWords(input: string): string {
  return normalizeForSearch(input)
    .replace(/\b(concluir|conclua|finalizar|finalize|terminei|terminar|termine|marcar|marque|desmarcar|desmarque|desmarca|desfazer|desfaca|como|concluida|concluido|finalizada|finalizado|feito|feita|pendente)\b/g, " ")
    .replace(/\b(excluir|exclua|remover|remove|remova|apagar|apague|delete|deletar|deleta|tirar|tire|tira|retirar|retire)\b/g, " ")
    .replace(/\b(criar|crie|adicione|adicionar|cadastre|cadastrar|registre|registrar|inclua|incluir|coloque|lance|lançar|lancar)\b/g, " ")
    .replace(/\b(editar|edite|alterar|altere|mudar|mude|trocar|troque|atualizar|atualize|renomear|renomeie|voltar|volte|defina|ajuste)\b/g, " ")
    .replace(/\b(chamada|chamado|nome|titulo|título|categoria|tipo|area|área|data|prazo|tempo|estimado|duracao|duração|prioridade|periodade|descricao|descrição|status|situacao|situação|que|tem|com|de|do|da|a|o|uma|um|tarefa|atividade|compromisso|essa|esta|esse|este)\b/g, " ")
    .replace(/\b(alta|media|média|baixa|urgente|importante|hoje|amanha|amanhã|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|hora|horas|min|mins|minuto|minutos|nao|não|nunca|ainda)\b/g, " ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:h|horas?|min|mins|minutos?)\b/g, " ")
    .replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ROBY_LAST_TASK_ID_KEY = "@AgileTask:robyLastTaskId";

function rememberTask(task?: Task | null) {
  if (!task) return;
  try {
    localStorage.setItem(ROBY_LAST_TASK_ID_KEY, task.id);
  } catch {
    // localStorage pode estar bloqueado em alguns navegadores.
  }
}

function getRememberedTask(tasks: Task[]): Task | undefined {
  try {
    const id = localStorage.getItem(ROBY_LAST_TASK_ID_KEY);
    return id ? tasks.find((task) => task.id === id) : undefined;
  } catch {
    return undefined;
  }
}

function getMostRecentTask(tasks: Task[]): Task | undefined {
  return [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

function extractTaskTarget(input: string): string | undefined {
  const quoted = input.match(/["“']([^"”']{3,})["”']/);
  if (quoted) return sanitizeTextValue(quoted[1]);

  const taskPattern = /\b(?:tarefa|atividade|compromisso)\s+(?:chamada|chamado|de|do|da)?\s*([^,;:\n]+?)(?=\s+(?:para|pra|como|com|em|no|na|e\s+(?:mude|altere|troque|atualize|coloque))\b|[,;:]|$)/i;
  const taskMatch = input.match(taskPattern);
  if (taskMatch) {
    const target = sanitizeTextValue(taskMatch[1]);
    if (target && !/^(para|pra|com|de|do|da|a|o)$/i.test(target)) return target;
  }

  const actionPattern = /\b(?:excluir|exclua|remover|remove|remova|apagar|apague|deletar|deleta|tirar|tire|tira|retirar|retire|concluir|conclua|finalizar|finalize|terminei|desmarcar|desmarque|desmarca|desfazer|desfaca|desfaça|editar|edite|alterar|altere|mudar|mude|trocar|troque|atualizar|atualize|renomeie)\b\s+(.+?)(?=\s+(?:para|pra|como|com|em|no|na)\b|[,;:]|$)/i;
  const actionMatch = input.match(actionPattern);
  if (actionMatch) {
    const target = sanitizeTextValue(actionMatch[1].replace(/^(a|o|uma|um|essa|esta|esse|este)\s+/i, ""));
    if (target && !/^(tarefa|atividade|compromisso)$/i.test(target)) return target;
  }

  const cleaned = stripActionWords(input);
  return cleaned || undefined;
}

function findTaskFromMessage(input: string, tasks: Task[]): Task | undefined {
  if (tasks.length === 0) return undefined;

  const raw = normalizeForSearch(input);
  if (/\b(essa|esta|esse|este|ultima|última|recente|recem|recém)\b/i.test(raw)) {
    return getRememberedTask(tasks) || getMostRecentTask(tasks);
  }

  const target = extractTaskTarget(input) || stripActionWords(input);
  const cleanedQuery = normalizeForSearch(target);
  const queryWords = searchWords(cleanedQuery);

  if (queryWords.length === 0) return undefined;

  const scored = tasks.map((task) => {
    const title = normalizeForSearch(task.title);
    const description = normalizeForSearch(task.description || "");
    const category = normalizeForSearch(task.category || "");
    const titleWords = searchWords(task.title);
    let score = 0;

    if (title === cleanedQuery) score += 160;
    if (cleanedQuery.length >= 3 && title.includes(cleanedQuery)) score += 120;
    if (cleanedQuery.length >= 3 && cleanedQuery.includes(title)) score += 100;

    for (const word of queryWords) {
      if (titleWords.includes(word)) score += 24;
      else if (title.includes(word)) score += 15;
      if (description.includes(word)) score += 4;
      if (category.includes(word)) score += 3;
    }

    return { task, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime();
  });

  return scored[0]?.score > 0 ? scored[0].task : undefined;
}

function extractTaskTitleSource(input: string): string {
  const quoted = input.match(/["“']([^"”']{3,})["”']/);
  if (quoted) return quoted[1];

  const colonIndex = input.indexOf(":");
  if (colonIndex >= 0 && colonIndex < input.length - 1) return input.slice(colonIndex + 1);

  const calledMatch = input.match(/\b(?:chamada|chamado|nome|t[ií]tulo)\s+(?:de|da|do|como|=|:)?\s*([^,;]+?)(?=\s+(?:para|pra|com|de\s+prioridade|prioridade|data|prazo|tempo|categoria|descri[cç][aã]o)\b|[,;]|$)/i);
  if (calledMatch) return calledMatch[1];

  return input;
}

function cleanTaskTitle(input: string): string {
  let title = extractTaskTitleSource(input);

  title = title
    .replace(/^\s*(por favor\s*)?(roby\s*,?\s*)?/i, " ")
    .replace(/\b(adicione|adicionar|crie|criar|cadastre|cadastrar|registre|registrar|inclua|incluir|coloque|lançe|lance|lançar|lancar)\b/gi, " ")
    .replace(/\b(uma|um|nova|novo)?\s*tarefa\b/gi, " ")
    .replace(/\b(atividade|compromisso)\b/gi, " ");

  const dateRegex = /\b(para|na|no|em)\s+(hoje|amanh[ãa]|depois de amanh[ãa]|domingo|segunda(?:[- ]feira)?|ter[cç]a(?:[- ]feira)?|quarta(?:[- ]feira)?|quinta(?:[- ]feira)?|sexta(?:[- ]feira)?|s[áa]bado)(\s+(que vem|pr[oó]xima|pr[oó]ximo))?/gi;
  title = title.replace(dateRegex, " ");

  title = title
    .replace(/\b(de\s+)?(prioridade\s+|periodade\s+)?(alta|m[eé]dia|media|baixa|urgente|importante)(\s+(prioridade|periodade))?\b/gi, " ")
    .replace(/\bcategoria\s*(?:para|pra|=|:)?\s*[^,;]+/gi, " ")
    .replace(/\bdescri[cç][aã]o\s*(?:para|pra|=|:)?\s*[^,;]+/gi, " ")
    .replace(/\b(vou|vai|deve|devo)\s+(demorar|levar|durar)[\s\S]*$/i, " ")
    .replace(/\b(?:uns?|umas?|cerca de|aproximadamente)?\s*\d+(?:[,.]\d+)?\s*(?:h|horas?|min|mins|minutos?)\b/gi, " ")
    .replace(/["'“”]/g, " ")
    .replace(/^[\s:;,\.\-–—]+|[\s:;,\.\-–—]+$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  title = title.replace(/^(e|que|é|eh|meu|minha|o|a|de|para|pra)\s+/i, "").trim();

  if (title.length < 3) return "Nova tarefa";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function extractFieldValue(input: string, labels: string[], options: { trimNext?: boolean } = { trimNext: true }): string | undefined {
  const labelPattern = labels.join("|");
  const rx = new RegExp(`\\b(?:${labelPattern})\\b[\\s\\S]*?(?:para|pra|como|=|:)\\s+([\\s\\S]+)$`, "i");
  const match = input.match(rx);
  if (match?.[1]) {
    const value = options.trimNext === false ? sanitizeTextValue(match[1]) : trimAtNextField(match[1]);
    return value || undefined;
  }

  const shortRx = new RegExp(`\\b(?:${labelPattern})\\s*[:=]\\s*([^,;]+)`, "i");
  const shortMatch = input.match(shortRx);
  if (shortMatch?.[1]) {
    const value = options.trimNext === false ? sanitizeTextValue(shortMatch[1]) : trimAtNextField(shortMatch[1]);
    return value || undefined;
  }

  return undefined;
}

function extractRenameValue(input: string): string | undefined {
  const explicit = extractFieldValue(input, ["titulo", "título", "nome"], { trimNext: true });
  if (explicit) return explicit;

  const renameMatch = input.match(/\b(?:renomeie|renomear|mude|alterar|altere|troque|trocar)\b[\s\S]*?\b(?:para|pra|como)\s+([\s\S]+)$/i);
  if (renameMatch?.[1]) return trimAtNextField(renameMatch[1]);

  return undefined;
}

function commandMatches(input: string, regex: RegExp): boolean {
  return regex.test(removeAccents(input.toLowerCase()));
}

function buildTaskNotFoundMessage(action: "excluir" | "concluir" | "desmarcar" | "editar", tasks: Task[]): string {
  const available = tasks
    .filter((task) => action === "concluir" ? task.status !== "done" : true)
    .slice(0, 5)
    .map((task) => `• ${task.title}`)
    .join("\n");

  return `Não encontrei a tarefa para ${action}. Escreva um pedaço do nome dela.\n\nTarefas disponíveis:\n${available || "Nenhuma tarefa cadastrada."}`;
}

function buildUpdatedFieldsMessage(updates: Partial<Task>): string {
  const lines: string[] = [];
  if (updates.title) lines.push(`• Nome: ${updates.title}`);
  if (updates.category) lines.push(`• Categoria: ${updates.category}`);
  if (updates.date) lines.push(`• Data: ${formatDateBr(updates.date)}`);
  if (updates.estimatedTime) lines.push(`• Tempo estimado: ${updates.estimatedTime}`);
  if (updates.priority) lines.push(`• Prioridade: ${updates.priority}`);
  if (updates.status) lines.push(`• Status: ${updates.status === "done" ? "Concluída" : updates.status === "inProgress" ? "Em andamento" : "A fazer"}`);
  if (updates.description) lines.push(`• Descrição: ${updates.description}`);
  return lines.join("\n");
}

function extractUpdatesFromMessage(input: string): Partial<Task> {
  const updates: Partial<Task> = {};
  const normalized = normalizeForSearch(input);

  const renameValue = extractRenameValue(input);
  if (renameValue && commandMatches(input, /\b(nome|titulo|título|renomeie|renomear)\b/)) {
    updates.title = renameValue.charAt(0).toUpperCase() + renameValue.slice(1);
  }

  const categoryValue = extractFieldValue(input, ["categoria", "tipo", "area", "área"]);
  if (categoryValue) updates.category = normalizeCategory(categoryValue);

  const descriptionValue = extractFieldValue(input, ["descrição", "descricao", "descri[cç][aã]o", "detalhes", "observa[cç][aã]o"], { trimNext: false });
  if (descriptionValue) updates.description = descriptionValue;

  const explicitPriority = extractFieldValue(input, ["prioridade", "periodade"]);
  const priority = explicitPriority ? normalizePriority(explicitPriority) : normalizePriority(input);
  if (priority && commandMatches(input, /\b(prioridade|periodade|alta|media|média|baixa|urgente|importante)\b/)) {
    updates.priority = priority;
  }

  if (commandMatches(input, /\b(data|prazo|vencimento|hoje|amanha|amanhã|depois de amanha|domingo|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|\d{1,2}[\/\-]\d{1,2})\b/)) {
    updates.date = parseRequestedDate(input);
  }

  if (commandMatches(input, /\b(tempo|estimado|duracao|duração|demorar|levar|durar|\d+(?:[,.]\d+)?\s*(h|hora|horas|min|mins|minuto|minutos))\b/)) {
    updates.estimatedTime = parseEstimatedTime(input);
  }

  const statusFromField = extractFieldValue(input, ["status", "situação", "situacao"]);
  const status = statusFromField ? normalizeStatus(statusFromField) : normalizeStatus(input);
  if (status && (normalized.includes("status") || normalized.includes("situacao") || normalized.includes("andamento") || normalized.includes("pendente") || normalized.includes("a fazer") || normalized.includes("concluida") || normalized.includes("concluido"))) {
    updates.status = status;
  }

  return updates;
}

function isQuestionAboutCreating(input: string): boolean {
  const msg = normalizeForSearch(input);
  return msg.includes("como criar") || msg.includes("como adicionar") || msg.includes("como cadastrar") || msg.includes("voce consegue criar") || msg.includes("pode criar");
}

function tryHandleTaskAction(
  input: string,
  tasks: Task[],
  actions: {
    addTask: (task: Omit<Task, "id" | "createdAt" | "status">) => Task | void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    updateTaskStatus: (id: string, status: Task["status"]) => void;
    deleteTask: (id: string) => void;
  },
): string | null {
  const wantsSetTodo = commandMatches(input, /\b(desmarcar|desmarque|desmarca|desmarcada|desmarcado|desfazer|desfaca|desfaça|retirar\s+de\s+concluida|tirar\s+de\s+concluida|voltar\s+para\s+(?:a\s+fazer|pendente)|volte\s+para\s+(?:a\s+fazer|pendente)|colocar\s+(?:como\s+)?(?:a\s+fazer|pendente)|coloque\s+(?:como\s+)?(?:a\s+fazer|pendente)|nao\s+(?:terminei|conclui|completei|finalizei|fiz)|ainda\s+nao\s+(?:terminei|conclui|completei|finalizei|fiz)|nao\s+esta\s+(?:concluida|concluido|feita|feito|finalizada|finalizado))\b/);
  const wantsDelete = commandMatches(input, /\b(excluir|exclua|remover|remove|remova|apagar|apague|delete|deletar|deleta|tirar|tire|tira|retirar|retire)\b/) && !wantsSetTodo;
  const wantsComplete = commandMatches(input, /\b(concluir|conclua|finalizar|finalize|ja\s+terminei|terminei|terminar|termine|marcar\s+como\s+concluida|marque\s+como\s+concluida|marcada\s+como\s+concluida|esta\s+concluida)\b/) && !wantsSetTodo;
  const wantsUpdate = commandMatches(input, /\b(editar|edite|alterar|altere|mudar|mude|trocar|troque|atualizar|atualize|renomear|renomeie|coloque|defina|ajuste)\b/) && !wantsDelete && !wantsSetTodo && !wantsComplete;
  const wantsCreate = commandMatches(input, /\b(adicione|adicionar|crie|criar|cadastre|cadastrar|registre|registrar|inclua|incluir|lance|lancar|lançar|nova tarefa|novo compromisso)\b/) && !isQuestionAboutCreating(input) && !wantsDelete && !wantsSetTodo && !wantsComplete;

  if (!wantsDelete && !wantsSetTodo && !wantsComplete && !wantsUpdate && !wantsCreate) return null;

  const sensitiveReason = detectSensitiveData(input);
  if ((wantsCreate || wantsUpdate) && sensitiveReason) {
    return buildPrivacyRefusal(sensitiveReason);
  }

  // Ordem importante: remover/concluir/editar vêm antes de criar.
  if (wantsDelete) {
    const task = findTaskFromMessage(input, tasks);
    if (!task) return buildTaskNotFoundMessage("excluir", tasks);
    rememberTask(task);
    actions.deleteTask(task.id);
    return `🗑️ Tarefa excluída com sucesso: "${task.title}".`;
  }

  if (wantsSetTodo) {
    const task = findTaskFromMessage(input, tasks);
    if (!task) return buildTaskNotFoundMessage("desmarcar", tasks);
    rememberTask(task);
    actions.updateTaskStatus(task.id, "todo");
    return `↩️ Tarefa desmarcada como concluída e voltou para A Fazer: "${task.title}".`;
  }

  if (wantsComplete) {
    const task = findTaskFromMessage(input, tasks.filter((t) => t.status !== "done"));
    if (!task) return buildTaskNotFoundMessage("concluir", tasks);
    rememberTask(task);
    actions.updateTaskStatus(task.id, "done");
    return `✅ Tarefa marcada como concluída: "${task.title}".`;
  }

  if (wantsUpdate) {
    const task = findTaskFromMessage(input, tasks);
    if (!task) return buildTaskNotFoundMessage("editar", tasks);

    const updates = extractUpdatesFromMessage(input);

    if (Object.keys(updates).length === 0) {
      return `Encontrei a tarefa "${task.title}", mas não entendi o que devo alterar. Exemplos:\n• mude a prioridade da tarefa ${task.title} para alta\n• edite a data da tarefa ${task.title} para amanhã\n• renomeie a tarefa ${task.title} para novo nome`;
    }

    rememberTask(task);
    if (updates.status && Object.keys(updates).length === 1) {
      actions.updateTaskStatus(task.id, updates.status);
    } else {
      actions.updateTask(task.id, updates);
    }

    return `✏️ Tarefa atualizada: "${task.title}".\n${buildUpdatedFieldsMessage(updates)}`.trim();
  }

  if (wantsCreate) {
    const newTask = {
      title: cleanTaskTitle(input),
      description: extractFieldValue(input, ["descrição", "descricao", "descri[cç][aã]o", "detalhes", "observa[cç][aã]o"], { trimNext: false }) || `Criada pelo Roby a partir do comando: "${input}"`,
      category: normalizeCategory(extractFieldValue(input, ["categoria", "tipo", "area", "área"]) || parseCategory(input)),
      priority: normalizePriority(extractFieldValue(input, ["prioridade", "periodade"]) || input) || parsePriority(input),
      date: parseRequestedDate(input),
      estimatedTime: parseEstimatedTime(input),
    };

    const createdTask = actions.addTask(newTask);
    if (createdTask && "id" in createdTask) rememberTask(createdTask as Task);

    return `✅ Tarefa criada com sucesso!\n\n• Nome: ${newTask.title}\n• Categoria: ${newTask.category}\n• Data: ${formatDateBr(newTask.date)}\n• Tempo estimado: ${newTask.estimatedTime}\n• Prioridade: ${newTask.priority}\n• Descrição: ${newTask.description}\n\nEla já foi adicionada à sua lista e ao Kanban.`;
  }

  return null;
}

function getSmartFallback(input: string, tasks: Task[]): string {
  const msg = input.toLowerCase();
  const normalizedMsg = normalizeForSearch(input);
  const today = new Date().toISOString().split("T")[0];

  if (
    normalizedMsg.includes("quem e voce") ||
    normalizedMsg.includes("quem e o roby") ||
    normalizedMsg.includes("seu nome") ||
    normalizedMsg.includes("o que voce faz")
  ) {
    return "Sou o Roby, o assistente do AgileTask. Posso criar, excluir, concluir e editar tarefas por comandos de texto. Também consigo alterar nome, categoria, data, tempo estimado, prioridade, descrição e status, além de mostrar atrasos, Kanban e resumos de produtividade.";
  }

  if (
    msg.includes("atrasad") ||
    msg.includes("atraso") ||
    msg.includes("vencid")
  ) {
    const overdue = tasks.filter((t) => t.date < today && t.status !== "done");
    if (overdue.length === 0)
      return "Ótimas notícias! Não há tarefas atrasadas. Você está em dia com tudo! 🎉";
    return `Encontrei ${overdue.length} tarefa(s) atrasada(s):\n${overdue.map((t) => `• "${t.title}" (${t.priority}) — venceu em ${new Date(t.date).toLocaleDateString("pt-BR")}`).join("\n")}\n\nSugiro priorizar as de alta urgência primeiro.`;
  }

  if (msg.includes("resumo") || msg.includes("semana")) {
    const done = tasks.filter((t) => t.status === "done").length;
    const pct =
      tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
    const alta = tasks.filter(
      (t) => t.priority === "Alta" && t.status !== "done",
    ).length;
    return `📊 Resumo da sua produtividade:\n\n• Total de tarefas: ${tasks.length}\n• Concluídas: ${done} (${pct}%)\n• Pendentes: ${tasks.length - done}\n• Alta prioridade pendente: ${alta}\n\n${pct >= 80 ? "Excelente trabalho! 🚀" : pct >= 50 ? "Bom progresso! Continue assim. 💪" : "Vamos focar nas prioridades! 🎯"}`;
  }

  if (msg.includes("hoje") || msg.includes("dia")) {
    const todayTasks = tasks.filter((t) => t.date === today);
    if (todayTasks.length === 0)
      return "Você não tem tarefas agendadas para hoje. Que tal criar uma nova? 📝";
    return `Para hoje você tem ${todayTasks.length} tarefa(s):\n${todayTasks.map((t) => `• ${t.status === "done" ? "✅" : t.status === "inProgress" ? "🔄" : "⬜"} "${t.title}" — ${t.priority}`).join("\n")}`;
  }

  if (
    msg.includes("prioridade") ||
    msg.includes("urgente") ||
    msg.includes("alta")
  ) {
    const high = tasks.filter(
      (t) => t.priority === "Alta" && t.status !== "done",
    );
    if (high.length === 0)
      return "Não há tarefas de alta prioridade pendentes. Parabéns! 🎉";
    return `Você tem ${high.length} tarefa(s) de alta prioridade:\n${high.map((t) => `• "${t.title}" — ${t.status === "inProgress" ? "Em andamento" : "A fazer"}`).join("\n")}\n\nRecomendo focar nelas agora!`;
  }

  if (
    msg.includes("kanban") ||
    msg.includes("board") ||
    msg.includes("quadro")
  ) {
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProg = tasks.filter((t) => t.status === "inProgress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return `Visão geral do seu Kanban:\n\n📋 A Fazer: ${todo} tarefa(s)\n🔄 Em Andamento: ${inProg} tarefa(s)\n✅ Concluído: ${done} tarefa(s)`;
  }

  if (
    msg.includes("criar") ||
    msg.includes("nova tarefa") ||
    msg.includes("adicionar")
  ) {
    return 'Agora eu consigo criar tarefas por comando. Exemplo: "adicione uma tarefa para quinta-feira que vem: trabalho de inglês, alta prioridade, 2h". 📝';
  }

  if (
    msg.includes("produtiv") ||
    msg.includes("foco") ||
    msg.includes("rotina")
  ) {
    const pending = tasks.filter((t) => t.status !== "done");
    const topTask = pending.find((t) => t.priority === "Alta") || pending[0];
    return `💡 Dica: Use a técnica Pomodoro — 25 min de foco, 5 min de pausa.\n\n${topTask ? `Sua próxima tarefa prioritária: "${topTask.title}".\n\nComece por ela agora!` : "Suas tarefas estão em dia! Aproveite para planejar a próxima semana."}`;
  }

  if (
    msg.includes("olá") ||
    msg.includes("oi") ||
    msg.includes("hey") ||
    msg.includes("boa")
  ) {
    const pending = tasks.filter((t) => t.status !== "done").length;
    return `Olá! Sou o Roby, seu assistente de produtividade! 👋\n\nVocê tem ${pending} tarefa(s) pendente(s). Como posso ajudar?\n\n• Criar tarefa: "adicione tarefa estudar inglês amanhã, prioridade alta, 2h"\n• Editar tarefa: "mude a data da tarefa estudar inglês para sexta"\n• Remover tarefa: "remova a tarefa estudar inglês"\n• Ver tarefas atrasadas ou resumo da semana`;
  }

  const responses = [
    `Entendi! Posso ajudar com suas ${tasks.length} tarefas. Pergunte sobre prioridades, prazos, resumos ou peça dicas de produtividade. 😊`,
    `Com base nas suas ${tasks.filter((t) => t.status !== "done").length} tarefas pendentes, o mais importante agora é focar nas de alta prioridade.`,
    `Estou aqui para ajudar! Diga-me o que precisa: organizar tarefas, ver atrasos, dicas de foco ou resumos.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function shouldAnswerInstantly(input: string): boolean {
  const msg = normalizeForSearch(input);
  const instantPatterns = [
    "oi",
    "olá",
    "ola",
    "bom dia",
    "boa tarde",
    "boa noite",
    "quem e voce",
    "quem e o roby",
    "seu nome",
    "o que voce faz",
    "atrasad",
    "atraso",
    "vencid",
    "resumo",
    "semana",
    "hoje",
    "prioridade",
    "urgente",
    "alta",
    "kanban",
    "quadro",
    "criar",
    "nova tarefa",
    "adicionar",
    "produtiv",
    "foco",
    "rotina",
    "desmarcar",
    "desmarque",
    "pendente",
    "a fazer",
    "concluida",
    "concluido",
  ];
  return instantPatterns.some((pattern) => msg.includes(pattern));
}

function cleanOllamaAnswer(answer: string): string {
  const raw = String(answer || "").trim();
  if (!raw) return "Não consegui gerar uma resposta final. Tente perguntar novamente de forma mais direta.";

  const removeHtml = (value: string) =>
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  // DeepSeek R1 às vezes usa blocos <think>. Removemos blocos completos.
  const withoutClosedThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (withoutClosedThink) return removeHtml(withoutClosedThink.replace(/<\/?think>/gi, ""));

  // Se o modelo não fechou </think>, não deixamos a resposta vazia.
  const withoutTags = raw.replace(/<\/?think>/gi, "").trim();
  return removeHtml(withoutTags) || "Não consegui gerar uma resposta final. Tente novamente.";
}

function sanitizeModelText(value: string): string {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function splitDeepSeekThinking(rawText: string): { thinking: string; answer: string; hasOpenThink: boolean } {
  const raw = String(rawText || "");
  const lowerRaw = raw.toLowerCase();
  const openTag = lowerRaw.indexOf("<think>");

  // Formato mais comum na API: <think>...</think> + resposta final.
  if (openTag !== -1) {
    const afterOpen = openTag + "<think>".length;
    const closeTag = lowerRaw.indexOf("</think>", afterOpen);

    if (closeTag === -1) {
      const beforeThink = raw.slice(0, openTag);
      const thinking = raw.slice(afterOpen);
      return {
        thinking: sanitizeModelText(thinking),
        answer: sanitizeModelText(beforeThink),
        hasOpenThink: true,
      };
    }

    const beforeThink = raw.slice(0, openTag);
    const thinking = raw.slice(afterOpen, closeTag);
    const afterThink = raw.slice(closeTag + "</think>".length);

    return {
      thinking: sanitizeModelText(thinking),
      answer: sanitizeModelText(`${beforeThink}\n${afterThink}`),
      hasOpenThink: false,
    };
  }

  // Alguns clientes/modelos exibem o raciocínio como "Thinking..." e encerram com
  // "...done thinking.". Esse tratamento deixa o site parecido com o terminal do Ollama,
  // separando processamento e resposta final quando esse formato vier no stream.
  const thinkingStartMatch = raw.match(/(?:^|\n)\s*Thinking\.\.\.\s*\n/i);
  if (thinkingStartMatch && thinkingStartMatch.index !== undefined) {
    const thinkingStart = thinkingStartMatch.index + thinkingStartMatch[0].length;
    const beforeThinking = raw.slice(0, thinkingStartMatch.index);
    const rest = raw.slice(thinkingStart);
    const doneMatch = rest.match(/(?:^|\n)\s*\.{3}\s*done thinking\.\s*\n?/i);

    if (doneMatch && doneMatch.index !== undefined) {
      const thinking = rest.slice(0, doneMatch.index);
      const answer = `${beforeThinking}\n${rest.slice(doneMatch.index + doneMatch[0].length)}`;
      return {
        thinking: sanitizeModelText(thinking),
        answer: sanitizeModelText(answer),
        hasOpenThink: false,
      };
    }

    return {
      thinking: sanitizeModelText(rest),
      answer: sanitizeModelText(beforeThinking),
      hasOpenThink: true,
    };
  }

  return { thinking: "", answer: sanitizeModelText(raw), hasOpenThink: false };
}

function finalAnswerFromOllamaRaw(rawText: string): string {
  const parsed = splitDeepSeekThinking(rawText);
  const finalAnswer = parsed.answer.trim();

  if (finalAnswer) return cleanOllamaAnswer(finalAnswer);
  if (parsed.thinking.trim()) {
    return "O DeepSeek gerou o processamento, mas ainda não entregou uma resposta final. Abra o painel de processamento para acompanhar o que foi gerado.";
  }

  return "Não consegui gerar uma resposta final. Tente perguntar novamente de forma mais direta.";
}

interface OllamaProgress {
  raw: string;
  thinking: string;
  answer: string;
  generation: string;
  model: string;
  done: boolean;
}


interface OllamaTagModel {
  name?: string;
  model?: string;
}

const MODEL_PRIORITY = [
  "deepseek-r1:1.5b",
  "deepseek-r1:8b",
  "deepseek-r1:7b",
  "deepseek-r1:14b",
  "deepseek-r1:32b",
];

const OLLAMA_REQUEST_TIMEOUT_MS = 300000; // 5 minutos: permite respostas abertas do DeepSeek sem cortar rápido demais
const OLLAMA_MODEL_CACHE_MS = 60000;
let cachedModelResolution: { baseUrl: string; requested: string; resolved: string; expiresAt: number } | null = null;

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = OLLAMA_REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
}

async function getInstalledOllamaModels(baseUrl: string): Promise<string[]> {
  const cleanBaseUrl = normalizeOllamaUrl(baseUrl);
  const response = await fetch(`${cleanBaseUrl}/api/tags`);
  if (!response.ok) return [];
  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];
  return models
    .map((item: OllamaTagModel) => item.name || item.model || "")
    .filter((name: string) => Boolean(name));
}

function pickBestLocalModel(installedModels: string[], requestedModel: string): string {
  if (installedModels.includes(requestedModel)) return requestedModel;

  for (const preferred of MODEL_PRIORITY) {
    if (installedModels.includes(preferred)) return preferred;
  }

  const deepseek = installedModels.find((name) => name.toLowerCase().includes("deepseek"));
  if (deepseek) return deepseek;

  return requestedModel;
}

async function resolveOllamaModel(baseUrl: string, requestedModel: string): Promise<string> {
  const selectedModel = normalizeOllamaModel(requestedModel);
  const now = Date.now();

  if (
    cachedModelResolution &&
    cachedModelResolution.baseUrl === baseUrl &&
    cachedModelResolution.requested === selectedModel &&
    cachedModelResolution.expiresAt > now
  ) {
    return cachedModelResolution.resolved;
  }

  const installed = await getInstalledOllamaModels(baseUrl);
  const best = pickBestLocalModel(installed, selectedModel);

  if (best !== selectedModel) {
    localStorage.setItem("@AgileTask:aiModel", best);
  }

  cachedModelResolution = {
    baseUrl,
    requested: selectedModel,
    resolved: best,
    expiresAt: now + OLLAMA_MODEL_CACHE_MS,
  };

  return best;
}

async function callOllama(
  userMessage: string,
  history: Message[],
  tasks: Task[],
  baseUrl: string,
  model: string,
  onProgress?: (progress: OllamaProgress) => void,
): Promise<string> {
  const cleanBaseUrl = normalizeOllamaUrl(baseUrl);
  const selectedModel = await resolveOllamaModel(cleanBaseUrl, model);
  const messages = [
    { role: "system", content: systemPrompt(tasks, selectedModel) },
    ...history
      .slice(-3)
      .map((m) => ({
        role: m.type === "ai" ? "assistant" : "user",
        content: m.content,
      })),
    { role: "user", content: userMessage },
  ];

  const response = await fetchWithTimeout(`${cleanBaseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
      keep_alive: "30m",
      options: {
        temperature: 0.1,
        top_k: 20,
        top_p: 0.75,
        num_ctx: 2048,
        num_predict: 900,
        num_thread: 6,
        repeat_penalty: 1.08,
      },
    }),
  });

  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      /* ignore */
    }
    throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
  }

  // O Ollama com stream=true envia JSON por linha. Isso permite atualizar a tela
  // enquanto o DeepSeek ainda está processando, sem deixar o usuário preso apenas
  // na mensagem "Pensando...".
  const reader = response.body?.getReader();
  if (!reader) {
    const data = await response.json();
    const content = typeof data.message?.content === "string" ? data.message.content : "";
    const thinking =
      typeof data.message?.thinking === "string"
        ? data.message.thinking
        : typeof data.thinking === "string"
          ? data.thinking
          : "";
    const parsed = splitDeepSeekThinking(content);
    const mergedThinking = sanitizeModelText([thinking, parsed.thinking].filter(Boolean).join("\n"));
    onProgress?.({
      raw: content,
      thinking: mergedThinking,
      answer: parsed.answer,
      generation: sanitizeModelText(parsed.answer || content),
      model: selectedModel,
      done: true,
    });
    return finalAnswerFromOllamaRaw(content || "Recebi sua mensagem. Posso ajudar você a criar, editar, concluir, desmarcar ou remover tarefas.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let rawContent = "";
  let rawThinking = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const data = JSON.parse(trimmed);
        const token = typeof data.message?.content === "string" ? data.message.content : "";
        const thinkingToken =
          typeof data.message?.thinking === "string"
            ? data.message.thinking
            : typeof data.thinking === "string"
              ? data.thinking
              : "";

        rawContent += token;
        rawThinking += thinkingToken;

        const parsed = splitDeepSeekThinking(rawContent);
        const mergedThinking = sanitizeModelText([rawThinking, parsed.thinking].filter(Boolean).join("\n"));
        onProgress?.({
          raw: rawContent,
          thinking: mergedThinking,
          answer: parsed.answer,
          generation: sanitizeModelText(parsed.answer || rawContent),
          model: selectedModel,
          done: Boolean(data.done),
        });
      } catch {
        // Mantém a geração viva se uma linha parcial chegar quebrada.
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer.trim());
      const token = typeof data.message?.content === "string" ? data.message.content : "";
      const thinkingToken =
        typeof data.message?.thinking === "string"
          ? data.message.thinking
          : typeof data.thinking === "string"
            ? data.thinking
            : "";
      rawContent += token;
      rawThinking += thinkingToken;
    } catch {
      /* ignore */
    }
  }

  const parsed = splitDeepSeekThinking(rawContent);
  const mergedThinking = sanitizeModelText([rawThinking, parsed.thinking].filter(Boolean).join("\n"));
  onProgress?.({
    raw: rawContent,
    thinking: mergedThinking,
    answer: parsed.answer,
    generation: sanitizeModelText(parsed.answer || rawContent),
    model: selectedModel,
    done: true,
  });

  return finalAnswerFromOllamaRaw(rawContent || "Recebi sua mensagem. Posso ajudar você a criar, editar, concluir, desmarcar ou remover tarefas.");
}

function parseOllamaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("AbortError") || msg.includes("aborted")) {
    return "o DeepSeek demorou mais que o limite configurado. Usei uma resposta rápida do próprio AgileTask";
  }
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("CORS")
  ) {
    return "não consegui conectar ao Ollama em http://localhost:11434. Confirme se o Ollama está aberto/rodando e se o modelo foi baixado";
  }
  if (msg.includes("HTTP 404")) {
    return "o modelo configurado não foi encontrado no Ollama. Rode ollama list e selecione um modelo instalado, como deepseek-r1:1.5b ou deepseek-r1:8b";
  }
  if (msg.includes("HTTP 500")) {
    return "o Ollama retornou erro interno ao carregar o modelo. Tente um modelo menor, como deepseek-r1:7b ou deepseek-r1:1.5b";
  }
  return msg;
}

function getFallbackNotice(errorDetail: string): string {
  return `Resposta gerada em modo inteligente local do AgileTask porque ${errorDetail}.`;
}

const ROBY_CHAT_HISTORY_KEY = "@AgileTask:robyChatHistory";
const MAX_STORED_MESSAGES = 120;

function createInitialMessages(): Message[] {
  return [
    {
      id: "1",
      type: "ai",
      content:
        `Olá! Sou o Roby, a IA do AgileTask com DeepSeek/Ollama local. 🤖

Agora posso responder perguntas gerais e também ajudar no AgileTask:
• Perguntas de estudo, programação, tecnologia, escrita e temas gerais vão para o DeepSeek local
• Ações de tarefas são executadas pelo próprio AgileTask
• Posso criar, remover, concluir, desmarcar e editar tarefas
• Posso alterar nome, categoria, data, tempo, prioridade, descrição e status

Por segurança, não salvo senhas, e-mails, telefones, documentos, endereços ou dados pessoais confidenciais.

Como posso ajudar hoje?`,
      time: format(new Date(), "HH:mm"),
    },
  ];
}

function isValidStoredMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Message>;
  return (
    typeof item.id === "string" &&
    (item.type === "ai" || item.type === "user") &&
    typeof item.content === "string" &&
    typeof item.time === "string"
  );
}

function loadStoredMessages(): Message[] {
  try {
    const stored = localStorage.getItem(ROBY_CHAT_HISTORY_KEY);
    if (!stored) return createInitialMessages();

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return createInitialMessages();

    const validMessages = parsed.filter(isValidStoredMessage).slice(-MAX_STORED_MESSAGES);
    return validMessages.length > 0 ? validMessages : createInitialMessages();
  } catch {
    localStorage.removeItem(ROBY_CHAT_HISTORY_KEY);
    return createInitialMessages();
  }
}

function saveStoredMessages(messages: Message[]) {
  try {
    const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(ROBY_CHAT_HISTORY_KEY, JSON.stringify(messagesToStore));
  } catch {
    // Se o navegador bloquear localStorage ou estourar espaço, o chat continua funcionando.
  }
}

// Estado global do Roby: mantém a requisição e o histórico vivos mesmo
// quando o usuário sai da página do Assistente de IA.
let robyGlobalMessages: Message[] | null = null;
let robyGlobalIsLoading = false;
let robyRequestVersion = 0;
const robyListeners = new Set<() => void>();

function getRobyGlobalMessages(): Message[] {
  if (!robyGlobalMessages) {
    robyGlobalMessages = loadStoredMessages();
  }
  return robyGlobalMessages;
}

function notifyRobyListeners() {
  robyListeners.forEach((listener) => listener());
}

function setRobyGlobalMessages(updater: Message[] | ((previous: Message[]) => Message[])) {
  const previous = getRobyGlobalMessages();
  const next = typeof updater === "function" ? (updater as (previous: Message[]) => Message[])(previous) : updater;
  robyGlobalMessages = next.slice(-MAX_STORED_MESSAGES);
  saveStoredMessages(robyGlobalMessages);
  notifyRobyListeners();
}

function appendRobyMessage(message: Message) {
  setRobyGlobalMessages((previous) => [...previous, message]);
}

function updateRobyMessage(messageId: string, updater: (message: Message) => Message) {
  setRobyGlobalMessages((previous) =>
    previous.map((message) => (message.id === messageId ? updater(message) : message)),
  );
}

function setRobyGlobalLoading(value: boolean) {
  robyGlobalIsLoading = value;
  notifyRobyListeners();
}

function useRobyGlobalChatState() {
  const [snapshot, setSnapshot] = useState(() => ({
    messages: getRobyGlobalMessages(),
    isLoading: robyGlobalIsLoading,
  }));

  useEffect(() => {
    const listener = () => {
      setSnapshot({
        messages: getRobyGlobalMessages(),
        isLoading: robyGlobalIsLoading,
      });
    };

    robyListeners.add(listener);
    listener();
    return () => {
      robyListeners.delete(listener);
    };
  }, []);

  return snapshot;
}

export function AIAssistant() {
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  const { messages, isLoading } = useRobyGlobalChatState();
  const [input, setInput] = useState("");
  const [openThinkingIds, setOpenThinkingIds] = useState<Set<string>>(() => new Set());
  const [isRestarting, setIsRestarting] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(
    () => normalizeOllamaUrl(localStorage.getItem("@AgileTask:ollamaUrl")),
  );
  const [aiModel, setAiModel] = useState(
    () => normalizeOllamaModel(localStorage.getItem("@AgileTask:aiModel")),
  );
  const [useOllama, setUseOllama] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOllamaConfig = () => {
      const url = normalizeOllamaUrl(localStorage.getItem("@AgileTask:ollamaUrl"));
      const model = normalizeOllamaModel(localStorage.getItem("@AgileTask:aiModel"));
      const enabled = localStorage.getItem("@AgileTask:useOllama") !== "false";
      setOllamaUrl(url);
      setAiModel(model);
      setUseOllama(enabled);
    };

    checkOllamaConfig();
    const interval = setInterval(checkOllamaConfig, 2000);
    window.addEventListener("storage", checkOllamaConfig);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkOllamaConfig);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleThinkingPanel = (messageId: string) => {
    setOpenThinkingIds((previous) => {
      const next = new Set(previous);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent | null, quickMsg?: string) => {
    if (e) e.preventDefault();
    const text = quickMsg || input;
    if (!text.trim() || robyGlobalIsLoading) return;

    const requestVersion = ++robyRequestVersion;
    const historyBeforeSend = getRobyGlobalMessages().slice(-3);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      time: format(new Date(), "HH:mm"),
    };

    appendRobyMessage(userMessage);
    setInput("");
    setRobyGlobalLoading(true);

    let aiMessageId: string | null = null;

    try {
      let responseText: string;
      const actionResponse = tryHandleTaskAction(text, tasks, {
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
      });

      if (actionResponse) {
        // Ações reais de tarefas continuam determinísticas e seguras.
        responseText = actionResponse;
      } else {
        const deterministicAnswer = getDeterministicGeneralAnswer(text, tasks, aiModel);
        if (deterministicAnswer) {
          responseText = deterministicAnswer;
        } else if (shouldAnswerInstantly(text)) {
          // Para demonstração e uso diário, perguntas do próprio AgileTask respondem instantaneamente.
          // Isso evita depender do tempo de geração do DeepSeek para ações como resumo, atrasadas, Kanban e prioridades.
          responseText = getSmartFallback(text, tasks);
        } else if (useOllama) {
          // Perguntas realmente gerais continuam indo para o DeepSeek local.
          // Agora usamos stream para mostrar a geração ao vivo. Se o modelo enviar <think>,
          // também mostramos esse bloco; se não enviar, o painel acompanha a própria resposta final.
          aiMessageId = `${Date.now() + 1}-stream`;
          appendRobyMessage({
            id: aiMessageId,
            type: "ai",
            content: "Conectando ao DeepSeek local...",
            thinking: "",
            generation: "Preparando conexão com o Ollama local...",
            isStreaming: true,
            model: aiModel,
            time: format(new Date(), "HH:mm"),
          });

          responseText = await callOllama(
            text,
            historyBeforeSend,
            tasks,
            ollamaUrl,
            aiModel,
            (progress) => {
              if (robyRequestVersion !== requestVersion || !aiMessageId) return;
              updateRobyMessage(aiMessageId, (message) => ({
                ...message,
                content:
                  progress.answer.trim() ||
                  progress.generation.trim() ||
                  "O DeepSeek está gerando sua resposta localmente. Use o botão abaixo para acompanhar a geração ao vivo.",
                thinking: progress.thinking,
                generation: progress.generation || progress.raw,
                model: progress.model,
                isStreaming: !progress.done,
              }));
            },
          );
        } else {
          responseText = "A IA local está desativada em Configurações > IA & API. Ative o DeepSeek local para eu responder diretamente pelo modelo.";
        }
      }

      if (robyRequestVersion !== requestVersion) return;

      if (aiMessageId) {
        updateRobyMessage(aiMessageId, (message) => ({
          ...message,
          content: responseText,
          generation: message.generation || responseText,
          isStreaming: false,
        }));
      } else {
        appendRobyMessage({
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: responseText,
          time: format(new Date(), "HH:mm"),
        });
      }
    } catch (err) {
      if (robyRequestVersion !== requestVersion) return;

      const errorDetail = parseOllamaError(err);
      const errorContent = `⚠️ Não consegui responder pelo DeepSeek local agora.

Detalhe: ${errorDetail}.

Verifique se o Ollama está rodando e se o modelo aparece em "ollama list". Se você tiver baixado outro modelo, eu tento detectar automaticamente o modelo DeepSeek instalado.`;

      if (aiMessageId) {
        updateRobyMessage(aiMessageId, (message) => ({
          ...message,
          content: errorContent,
          isStreaming: false,
        }));
      } else {
        appendRobyMessage({
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: errorContent,
          time: format(new Date(), "HH:mm"),
        });
      }
    } finally {
      if (robyRequestVersion === requestVersion) {
        setRobyGlobalLoading(false);
      }
    }
  };

  const clearChat = () => {
    robyRequestVersion += 1;
    setRobyGlobalLoading(false);
    setIsRestarting(true);
    const freshMessages = createInitialMessages();
    setRobyGlobalMessages(freshMessages);
    setTimeout(() => setIsRestarting(false), 700);
  };

  const suggestions = [
    "Quais são minhas tarefas atrasadas?",
    "Resumo da semana",
    "Tarefas de alta prioridade",
    "Como está meu Kanban?",
    "Dica de produtividade",
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-300" />
            Assistente de IA Roby
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-600 dark:text-slate-300">
              Converse com o Roby para organizar tarefas e otimizar sua rotina.
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${useOllama ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {useOllama ? `🟢 DeepSeek direto: ${aiModel}` : "🔵 Modo inteligente local"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearChat}
            title="Reiniciar conversa"
            className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
          >
            <motion.span
              animate={isRestarting ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ display: "inline-flex" }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.span>
            <span className="hidden sm:block">Reiniciar</span>
          </button>
          {!useOllama && (
            <a
              href="/configuracoes"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-110"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:block">Configurar IA</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 model5-panel agile-ai-panel rounded-[32px] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-950/20"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[88%] ${msg.type === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border
                  ${msg.type === "ai" ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white border-white/15" : "bg-white/[0.08] text-slate-200 border-white/10"}
                `}
                >
                  {msg.type === "ai" ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div
                  className={`flex flex-col gap-1 ${msg.type === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-bold text-slate-200">
                      {msg.type === "ai" ? "Roby" : "Você"}
                    </span>
                    <span className="text-xs text-slate-400">{msg.time}</span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                    ${
                      msg.type === "user"
                        ? "whitespace-pre-line bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-tr-none"
                        : "bg-slate-950/55 text-slate-100 border border-white/10 rounded-tl-none"
                    }
                  `}
                  >
                    {msg.type === "ai" ? (
                      <>
                        <RobyMarkdownMessage
                          content={
                            msg.content ||
                            (msg.isStreaming
                              ? "O DeepSeek está preparando a resposta final..."
                              : "")
                          }
                        />

                        {(msg.thinking || msg.generation || msg.isStreaming) && (
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <button
                              type="button"
                              onClick={() => toggleThinkingPanel(msg.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-300/15"
                            >
                              {openThinkingIds.has(msg.id)
                                ? "Ocultar geração da IA"
                                : msg.isStreaming
                                  ? "Mostrar geração ao vivo"
                                  : msg.thinking
                                    ? "Mostrar processamento do modelo"
                                    : "Mostrar geração da IA"}
                            </button>

                            {openThinkingIds.has(msg.id) && (
                              <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-slate-300">
                                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                                  {msg.isStreaming && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  {msg.thinking ? "Processamento do modelo" : "Geração ao vivo do modelo"} {msg.model ? `(${msg.model})` : ""}
                                </div>
                                <pre className="whitespace-pre-wrap break-words font-mono">
                                  {msg.thinking?.trim() ||
                                    msg.generation?.trim() ||
                                    msg.content?.trim() ||
                                    "Aguardando o DeepSeek enviar a primeira parte da resposta..."}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && !messages.some((message) => message.isStreaming) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[88%]"
            >
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-white border border-white/15 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-slate-200">
                    Roby
                  </span>
                </div>
                <div className="bg-slate-950/55 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
                  <span className="text-sm text-slate-300">Pensando...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-slate-950/40 border-t border-white/10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Pergunte algo ao Roby ou peça uma ação no AgileTask..."
              className="w-full pl-4 pr-12 py-3.5 bg-slate-950/65 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-400/35 focus:border-cyan-300 outline-none transition-all text-slate-100 placeholder:text-slate-400 text-sm disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center gap-2 mt-3 px-1 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-300 shrink-0">
              Sugestões:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSend(null, s)}
                disabled={isLoading}
                className="text-xs text-cyan-100 bg-white/[0.07] hover:bg-white/[0.12] px-3 py-1.5 rounded-full transition-colors font-bold whitespace-nowrap shrink-0 disabled:opacity-50 border border-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

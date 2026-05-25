import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Flag,
  Lightbulb,
  Loader2,
  PlayCircle,
  RefreshCw,
  Route,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { Task, useTasks } from "../context/TaskContext";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "deepseek-r1:1.5b";
const MODEL_PRIORITY = ["deepseek-r1:1.5b", "deepseek-r1:8b", "deepseek-r1:7b", "deepseek-r1:14b"];

function normalizeOllamaUrl(value: string | null | undefined): string {
  return String(value || DEFAULT_OLLAMA_URL).trim().replace(/\/+$/, "") || DEFAULT_OLLAMA_URL;
}

function normalizeOllamaModel(value: string | null | undefined): string {
  const cleaned = String(value || DEFAULT_OLLAMA_MODEL).trim();
  if (!cleaned || cleaned === "deepseek-chat" || cleaned === "deepseek-reasoner") return DEFAULT_OLLAMA_MODEL;
  return cleaned;
}

function taskStatusLabel(status: Task["status"]): string {
  if (status === "done") return "Concluída";
  if (status === "inProgress") return "Em andamento";
  return "A fazer";
}

function priorityTone(priority: Task["priority"]): string {
  if (priority === "Alta") return "agile-priority-badge agile-priority-alta";
  if (priority === "Média") return "agile-priority-badge agile-priority-media";
  return "agile-priority-badge agile-priority-baixa";
}

function formatDate(date: string): string {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return date || "Sem prazo definido";
  }
}

function cleanAiPlan(answer: string): string {
  return String(answer || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fallbackPlan(task: Task): string {
  const description = task.description?.trim() || "A tarefa não possui descrição detalhada. Comece definindo o resultado esperado.";
  return `Plano ágil para executar a tarefa

1. Objetivo
- Tarefa: ${task.title}
- Descrição: ${description}
- Prioridade: ${task.priority}
- Prazo: ${formatDate(task.date)}
- Tempo estimado: ${task.estimatedTime || "não informado"}

2. Por onde começar
- Separe 5 minutos para entender o resultado final esperado.
- Liste os materiais, links ou informações necessárias.
- Transforme a tarefa em 3 etapas pequenas: preparar, executar e revisar.

3. Como executar
- Comece pela parte mais simples para ganhar ritmo.
- Trabalhe em blocos de foco de 25 a 50 minutos.
- Evite multitarefa e deixe apenas o necessário aberto.

4. Dicas práticas
- Faça primeiro um rascunho, sem buscar perfeição.
- Revise apenas no final.
- Se travar, execute o menor próximo passo possível.

5. Onde terminar
- Finalize quando o resultado estiver revisado, salvo e pronto para entrega. Depois marque a tarefa como concluída no AgileTask.`;
}

interface OllamaTagModel { name?: string; model?: string }

async function getInstalledOllamaModels(baseUrl: string): Promise<string[]> {
  const response = await fetchWithTimeout(`${normalizeOllamaUrl(baseUrl)}/api/tags`, {}, 5000);
  if (!response.ok) return [];
  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];
  return models.map((item: OllamaTagModel) => item.name || item.model || "").filter(Boolean);
}

function pickBestModel(installedModels: string[], requestedModel: string): string {
  if (installedModels.includes(requestedModel)) return requestedModel;
  for (const preferred of MODEL_PRIORITY) if (installedModels.includes(preferred)) return preferred;
  return installedModels.find((name) => name.toLowerCase().includes("deepseek")) || requestedModel;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

type PlanUpdateCallback = (partialPlan: string) => void;

function parseOllamaStreamLine(line: string): string {
  if (!line.trim()) return "";
  try {
    const data = JSON.parse(line);
    return String(data?.message?.content || data?.response || "");
  } catch {
    return "";
  }
}

async function generateTaskPlanWithOllama(task: Task, onUpdate?: PlanUpdateCallback): Promise<{ plan: string; model: string }> {
  const baseUrl = normalizeOllamaUrl(localStorage.getItem("@AgileTask:ollamaUrl"));
  const requestedModel = normalizeOllamaModel(localStorage.getItem("@AgileTask:aiModel"));
  const installedModels = await getInstalledOllamaModels(baseUrl);

  if (!installedModels.length) {
    throw new Error(`Ollama não respondeu em ${baseUrl}. Confirme se o serviço está ativo e se o comando "ollama list" mostra o DeepSeek.`);
  }

  const model = pickBestModel(installedModels, requestedModel);
  if (model !== requestedModel) localStorage.setItem("@AgileTask:aiModel", model);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120000);
  let fullText = "";

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: true,
        keep_alive: "30m",
        options: {
          temperature: 0.1,
          top_p: 0.8,
          repeat_penalty: 1.08,
          num_predict: 700,
          num_ctx: 2048,
        },
        messages: [
          {
            role: "system",
            content:
              "Você é Roby, assistente de produtividade do AgileTask. Gere um planejamento realista, prático e objetivo para executar tarefas. Responda em português do Brasil. Não use HTML, não invente dados pessoais e não mencione limitações técnicas. Estruture em tópicos claros.",
          },
          {
            role: "user",
            content: `Crie um planejamento de execução para esta tarefa do AgileTask.

Dados da tarefa:
- Nome: ${task.title}
- Descrição: ${task.description || "sem descrição"}
- Categoria: ${task.category || "sem categoria"}
- Prioridade: ${task.priority}
- Prazo: ${formatDate(task.date)}
- Tempo estimado: ${task.estimatedTime || "não informado"}
- Status atual: ${taskStatusLabel(task.status)}

Obrigatório responder com estas seções:
1. Objetivo da tarefa
2. Por onde começar
3. Planejamento passo a passo
4. Dicas para executar melhor
5. Como saber que terminou
6. Próxima ação imediata`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) {
      const data = await response.json();
      const content = cleanAiPlan(data?.message?.content || data?.response || "");
      if (!content) throw new Error("A IA retornou uma resposta vazia.");
      return { plan: content, model };
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const delta = parseOllamaStreamLine(line);
        if (!delta) continue;
        fullText += delta;
        const cleaned = cleanAiPlan(fullText);
        onUpdate?.(cleaned || "DeepSeek está analisando a tarefa e preparando o plano...");
      }
    }

    if (buffer.trim()) {
      const delta = parseOllamaStreamLine(buffer);
      if (delta) fullText += delta;
    }

    const content = cleanAiPlan(fullText);
    if (!content) throw new Error("A IA retornou uma resposta vazia depois do processamento.");
    return { plan: content, model };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("O DeepSeek demorou mais de 120 segundos para responder. Use o modelo deepseek-r1:1.5b para gerar planos mais rápido ou tente novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function storageKey(taskId: string) { return `@AgileTask:taskPlan:${taskId}`; }

export function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { openCreateModal } = useOutletContext<{ openCreateModal: (id?: string) => void }>();
  const { tasks, updateTaskStatus, deleteTask } = useTasks();
  const task = tasks.find((item) => item.id === taskId);
  const [plan, setPlan] = useState("");
  const [planSource, setPlanSource] = useState<"DeepSeek" | "Local" | "Salvo">("Local");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const autoPlanTaskIdRef = useRef<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!task) return;
    setIsGenerating(true);
    setGenerationError("");
    setPlanSource("DeepSeek");
    setPlan("Conectando ao Ollama local e preparando o planejamento com DeepSeek...");

    try {
      const useOllama = localStorage.getItem("@AgileTask:useOllama") !== "false";
      if (!useOllama) throw new Error("IA local desativada nas configurações do AgileTask.");

      const result = await generateTaskPlanWithOllama(task, (partialPlan) => {
        setPlan(partialPlan);
      });

      setPlan(result.plan);
      setPlanSource("DeepSeek");
      localStorage.setItem(storageKey(task.id), result.plan);
      localStorage.setItem(`${storageKey(task.id)}:source`, "DeepSeek");
      toast.success(`Planejamento gerado pelo DeepSeek local (${result.model})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao conectar com a IA.";
      const fallback = fallbackPlan(task);
      setPlan(fallback);
      setPlanSource("Local");
      localStorage.setItem(storageKey(task.id), fallback);
      localStorage.setItem(`${storageKey(task.id)}:source`, "Local");
      setGenerationError(`${message} Mantive um plano local para você continuar usando a página.`);
      toast.error("Não foi possível gerar com DeepSeek agora. Verifique o Ollama e tente novamente.");
      console.error("Erro ao gerar planejamento", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!task?.id) return;
    const saved = localStorage.getItem(storageKey(task.id));
    const savedSource = localStorage.getItem(`${storageKey(task.id)}:source`) as "DeepSeek" | "Local" | null;
    if (saved) { setPlan(saved); setPlanSource(savedSource || "Salvo"); return; }
    setPlan(fallbackPlan(task));
    setPlanSource("Local");
  }, [task?.id]);

  useEffect(() => {
    // Para manter a navegação fluida, a página mostra primeiro um plano local.
    // O usuário pode atualizar com DeepSeek no botão "Gerar plano com IA".
    if (!task?.id) return;
    autoPlanTaskIdRef.current = task.id;
  }, [task?.id]);

  if (!task) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="model5-panel max-w-md rounded-[32px] p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Tarefa não encontrada</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-300">Ela pode ter sido removida ou não existe mais neste navegador.</p>
          <Link to="/tarefas" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 font-bold text-white dark:bg-white dark:text-slate-950"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </div>
      </div>
    );
  }

  const isDone = task.status === "done";

  return (
    <div className="space-y-7">
      <section className="model5-hero p-7 text-white md:p-8">
        <Link to="/tarefas" className="model5-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-100"><ArrowLeft className="h-4 w-4" /> voltar</Link>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className={`text-4xl font-black leading-tight tracking-tight md:text-5xl ${isDone ? "line-through decoration-emerald-300/70" : ""}`}>{task.title}</h1>
            <p className="mt-4 max-w-2xl text-sky-50/85">{task.description || "Esta tarefa ainda não possui descrição. Adicione detalhes para receber orientações mais precisas da IA."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openCreateModal(task.id)} className="rounded-2xl bg-white/14 px-4 py-3 font-black text-white ring-1 ring-white/15 hover:bg-white/20"><Edit2 className="mr-2 inline h-4 w-4" /> Editar</button>
            <button onClick={() => updateTaskStatus(task.id, isDone ? "todo" : "done")} className="agile-solid-button rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white hover:-translate-y-1"><CheckCircle2 className="mr-2 inline h-4 w-4" /> {isDone ? "Reabrir" : "Concluir"}</button>
            <button onClick={() => { if (confirm("Tem certeza que deseja excluir esta tarefa?")) { deleteTask(task.id); localStorage.removeItem(storageKey(task.id)); navigate("/tarefas"); } }} className="rounded-2xl bg-red-500/20 px-4 py-3 font-black text-red-100 ring-1 ring-red-200/20 hover:bg-red-500/30"><Trash2 className="mr-2 inline h-4 w-4" /> Excluir</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[{ icon: Tag, label: "Categoria", value: task.category || "Sem categoria" }, { icon: Flag, label: "Prioridade", value: task.priority }, { icon: Calendar, label: "Prazo", value: formatDate(task.date) }, { icon: Clock, label: "Tempo", value: task.estimatedTime || "Não informado" }].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="model5-stat rounded-[28px] p-5"><div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-300"><Icon className="h-4 w-4" /> {item.label}</div><p className="mt-3 font-black capitalize text-slate-950 dark:text-white">{item.value}</p></div>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[.85fr_1.35fr]">
        <section className="model5-panel rounded-[32px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-violet-500 text-white"><Lightbulb className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-black text-slate-950 dark:text-white">Detalhamento</h2><p className="text-sm text-slate-500 dark:text-slate-300">Contexto principal da tarefa.</p></div>
          </div>
          <div className="space-y-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <div><h3 className="mb-1 font-black text-slate-950 dark:text-white">Nome</h3><p>{task.title}</p></div>
            <div><h3 className="mb-1 font-black text-slate-950 dark:text-white">Descrição</h3><p className="whitespace-pre-wrap">{task.description || "Sem descrição cadastrada."}</p></div>
            <div><h3 className="mb-1 font-black text-slate-950 dark:text-white">Status atual</h3><p>{taskStatusLabel(task.status)}</p></div>
          </div>
          <div className="mt-6 rounded-[28px] border border-slate-200/50 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="mb-2 flex items-center gap-2 font-black text-slate-950 dark:text-white"><PlayCircle className="h-4 w-4 text-emerald-400" /> Começo recomendado</div>
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">Comece definindo o resultado esperado, reúna materiais e execute a menor primeira etapa possível para ganhar ritmo.</p>
          </div>
        </section>

        <section className="model5-panel overflow-hidden rounded-[32px]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950"><Sparkles className="h-5 w-5" /></div>
              <div><h2 className="text-xl font-black text-slate-950 dark:text-white">Planejamento com IA</h2><p className="text-sm text-slate-500 dark:text-slate-300">Dicas, etapas e finalização do início ao fim.</p></div>
            </div>
            <button onClick={handleGeneratePlan} disabled={isGenerating} className="agile-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 font-black text-white shadow-xl shadow-cyan-500/15 disabled:cursor-wait disabled:opacity-70">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isGenerating ? "Gerando com DeepSeek..." : "Gerar plano com IA"}
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-white/45 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"><Route className="h-3.5 w-3.5" /> Fonte: {planSource}</span>
              {generationError && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/12 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-200"><AlertTriangle className="h-3.5 w-3.5" /> {generationError}</span>}
            </div>
            <div className="rounded-[28px] border border-slate-200/50 bg-white/45 p-5 dark:border-white/10 dark:bg-slate-950/45">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700 dark:text-slate-200">{plan || "Clique em Gerar com IA para criar um planejamento detalhado."}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { Task, useTasks } from "../context/TaskContext";

function formatDate(date: string) {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function statusLabel(status: Task["status"]) {
  if (status === "done") return "Concluída";
  if (status === "inProgress") return "Em andamento";
  return "A fazer";
}

function priorityTone(priority: Task["priority"]) {
  if (priority === "Alta") return "agile-priority-badge agile-priority-alta";
  if (priority === "Média") return "agile-priority-badge agile-priority-media";
  return "agile-priority-badge agile-priority-baixa";
}

function statusTone(status: Task["status"]) {
  if (status === "done") return "border-emerald-300/30 bg-emerald-400/15 text-emerald-200";
  if (status === "inProgress") return "border-cyan-300/30 bg-cyan-400/15 text-cyan-100";
  return "border-sky-300/30 bg-sky-400/15 text-sky-100";
}

const overviewConfig = {
  active: {
    label: "Tarefas ativas",
    eyebrow: "Foco de execução",
    description: "Tarefas que ainda precisam avançar no fluxo. Clique em qualquer card para abrir detalhes, editar ou gerar um plano com IA.",
    icon: Target,
    gradient: "from-cyan-500 via-blue-600 to-violet-700",
  },
  done: {
    label: "Tarefas concluídas",
    eyebrow: "Entregas finalizadas",
    description: "Todas as tarefas já concluídas, úteis para acompanhar progresso e revisar entregas.",
    icon: CheckCircle2,
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
  },
  inProgress: {
    label: "Tarefas em andamento",
    eyebrow: "Execução ativa",
    description: "Tarefas que estão em desenvolvimento agora. Use esta tela para acompanhar o sprint em movimento.",
    icon: Zap,
    gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
  },
  overdue: {
    label: "Tarefas atrasadas",
    eyebrow: "Atenção necessária",
    description: "Tarefas vencidas que ainda não foram concluídas. Priorize estas tarefas para recuperar o fluxo.",
    icon: Flame,
    gradient: "from-rose-500 via-red-600 to-orange-700",
  },
  high: {
    label: "Alta prioridade",
    eyebrow: "Impacto alto",
    description: "Tarefas pendentes de alta prioridade. Resolva primeiro o que causa maior impacto no projeto.",
    icon: Flame,
    gradient: "from-orange-500 via-rose-600 to-red-700",
  },
} as const;

type OverviewKey = keyof typeof overviewConfig;

function getFilteredTasks(tasks: Task[], type: OverviewKey) {
  const now = new Date();
  if (type === "active") return tasks.filter((task) => task.status !== "done");
  if (type === "done") return tasks.filter((task) => task.status === "done");
  if (type === "inProgress") return tasks.filter((task) => task.status === "inProgress");
  if (type === "overdue") {
    return tasks.filter((task) => task.status !== "done" && task.date && new Date(`${task.date}T23:59:59`) < now);
  }
  if (type === "high") return tasks.filter((task) => task.priority === "Alta" && task.status !== "done");
  return tasks;
}

function TaskOverviewCard({ task }: { task: Task }) {
  const navigate = useNavigate();

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/tarefas/${task.id}`)}
      className="model5-panel model5-card-hover group relative overflow-hidden rounded-[30px] p-5 text-left transition-all"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-400" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(task.status)}`}>{statusLabel(task.status)}</span>
            <span className={priorityTone(task.priority)}>{task.priority}</span>
          </div>
          <h3 className={`line-clamp-2 text-xl font-black tracking-tight text-slate-950 dark:text-white ${task.status === "done" ? "line-through decoration-emerald-300/80 opacity-70" : ""}`}>{task.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{task.description || "Abra esta tarefa para ver o planejamento detalhado com IA."}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-cyan-700 ring-1 ring-slate-200/60 transition group-hover:scale-105 dark:bg-white/10 dark:text-cyan-100 dark:ring-white/10">
          <ArrowUpRight className="h-5 w-5" />
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-4 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300 sm:grid-cols-4">
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/10"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.date)}</span>
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/10"><Timer className="h-3.5 w-3.5" /> {task.estimatedTime || "—"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/10"><Sparkles className="h-3.5 w-3.5" /> {task.category || "Sem categoria"}</span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-cyan-400/15 px-3 py-2 text-cyan-700 dark:text-cyan-100"><Clock3 className="h-3.5 w-3.5" /> plano IA</span>
      </div>
    </motion.button>
  );
}

export function TaskOverview() {
  const params = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { openCreateModal } = useOutletContext<{ openCreateModal: (id?: string) => void }>();

  const type = (params.type && params.type in overviewConfig ? params.type : "active") as OverviewKey;
  const config = overviewConfig[type];
  const Icon = config.icon;

  const filteredTasks = useMemo(() => getFilteredTasks(tasks, type), [tasks, type]);

  const totalHours = filteredTasks.reduce((sum, task) => {
    const match = String(task.estimatedTime || "").match(/(\d+(?:[.,]\d+)?)/);
    return sum + (match ? Number(match[1].replace(",", ".")) : 0);
  }, 0);

  const quickFilters: { label: string; type: OverviewKey; count: number }[] = [
    { label: "Ativas", type: "active", count: getFilteredTasks(tasks, "active").length },
    { label: "Concluídas", type: "done", count: getFilteredTasks(tasks, "done").length },
    { label: "Em andamento", type: "inProgress", count: getFilteredTasks(tasks, "inProgress").length },
    { label: "Atrasadas", type: "overdue", count: getFilteredTasks(tasks, "overdue").length },
    { label: "Alta prioridade", type: "high", count: getFilteredTasks(tasks, "high").length },
  ];

  return (
    <div className="space-y-7">
      <section className={`model5-hero overflow-hidden p-7 text-white md:p-8 bg-gradient-to-br ${config.gradient}`}>
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <button onClick={() => navigate(-1)} className="model5-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-white/16">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-white/85 ring-1 ring-white/20">
              <Icon className="h-4 w-4" /> {config.eyebrow}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">{config.label}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-sky-50/90">{config.description}</p>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="model5-chip rounded-3xl p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-100/70">Encontradas</div>
              <div className="mt-2 text-3xl font-black">{filteredTasks.length}</div>
            </div>
            <div className="model5-chip rounded-3xl p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-100/70">Tempo previsto</div>
              <div className="mt-2 text-3xl font-black">{totalHours ? `${totalHours}h` : "—"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="model5-panel rounded-[32px] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <button
                key={item.type}
                onClick={() => navigate(`/tarefas/visao/${item.type}`)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition-all ${type === item.type ? "bg-slate-950 text-white shadow-xl dark:bg-white dark:text-slate-950" : "bg-white/50 text-slate-600 hover:bg-white/80 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12"}`}
              >
                {item.label} <span className="ml-1 opacity-70">{item.count}</span>
              </button>
            ))}
          </div>
          <button onClick={() => openCreateModal()} className="agile-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/20">
            <Plus className="h-4 w-4 text-white" /> Nova tarefa
          </button>
        </div>
      </section>

      {filteredTasks.length === 0 ? (
        <section className="model5-panel rounded-[32px] p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 text-cyan-700 ring-1 ring-slate-200/60 dark:bg-white/10 dark:text-cyan-100 dark:ring-white/10">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Nenhuma tarefa nesta visão</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">Quando uma tarefa entrar nesta categoria, ela aparecerá aqui automaticamente. Você também pode criar uma nova tarefa agora.</p>
          <button onClick={() => openCreateModal()} className="agile-action-button mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/20">
            <Plus className="h-4 w-4 text-white" /> Criar tarefa
          </button>
        </section>
      ) : (
        <motion.section layout className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredTasks.map((task) => <TaskOverviewCard key={task.id} task={task} />)}
        </motion.section>
      )}
    </div>
  );
}

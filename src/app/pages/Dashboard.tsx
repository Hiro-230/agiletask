import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Plus,
  Search,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTasks, Task } from "../context/TaskContext";

function formatDate(date: string) {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return date;
  }
}

function priorityTone(priority: Task["priority"]) {
  if (priority === "Alta") return "agile-priority-badge agile-priority-alta";
  if (priority === "Média") return "agile-priority-badge agile-priority-media";
  return "agile-priority-badge agile-priority-baixa";
}

function statusLabel(status: Task["status"]) {
  if (status === "done") return "Concluída";
  if (status === "inProgress") return "Em andamento";
  return "A fazer";
}

export function Dashboard() {
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const { openCreateModal } = useOutletContext<{ openCreateModal: (id?: string) => void }>();
  const [search, setSearch] = useState("");

  const name = localStorage.getItem("@AgileTask:name") || "Gabriel";
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "inProgress").length;
  const overdue = tasks.filter((t) => t.status !== "done" && t.date && new Date(`${t.date}T23:59:59`) < new Date()).length;
  const productivity = total ? Math.round((completed / total) * 100) : 0;
  const activeTasks = tasks.filter((t) => t.status !== "done");

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? tasks.filter((task) => [task.title, task.description, task.category, task.priority, task.status, task.estimatedTime, task.date].join(" ").toLowerCase().includes(term))
      : activeTasks;
    return base.slice(0, 5);
  }, [search, tasks, activeTasks]);

  const statusRows = [
    { label: "A fazer", value: tasks.filter((t) => t.status === "todo").length, width: total ? `${Math.max(8, (tasks.filter((t) => t.status === "todo").length / total) * 100)}%` : "0%", color: "from-sky-400 to-blue-500" },
    { label: "Em andamento", value: inProgress, width: total ? `${Math.max(8, (inProgress / total) * 100)}%` : "0%", color: "from-violet-400 to-fuchsia-500" },
    { label: "Concluídas", value: completed, width: total ? `${Math.max(8, (completed / total) * 100)}%` : "0%", color: "from-emerald-300 to-teal-400" },
  ];

  const stats = [
    { label: "Tarefas ativas", value: activeTasks.length, delta: "+ foco hoje", icon: Target, tone: "text-cyan-500", route: "/tarefas/visao/active", hint: "Ver pendentes e em andamento" },
    { label: "Concluídas", value: completed, delta: `${productivity}% do total`, icon: CheckCircle2, tone: "text-emerald-500", route: "/tarefas/visao/done", hint: "Ver entregas finalizadas" },
    { label: "Em andamento", value: inProgress, delta: "fluxo atual", icon: Zap, tone: "text-violet-500", route: "/tarefas/visao/inProgress", hint: "Ver execução ativa" },
    { label: "Atrasadas", value: overdue, delta: overdue ? "precisa atenção" : "tudo certo", icon: Flame, tone: overdue ? "text-rose-500" : "text-cyan-500", route: "/tarefas/visao/overdue", hint: "Ver tarefas vencidas" },
  ];

  return (
    <div className="space-y-7">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="model5-hero p-7 text-white md:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="model5-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
              <Sparkles className="h-4 w-4" /> Zenith Flow
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">Bom dia, {name}! 👋</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-sky-50/85">
              Seu painel ágil com visão de montanha: veja prioridades, avance no sprint e transforme tarefas em execução real.
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="model5-chip rounded-3xl p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-100/70">Produtividade</div>
              <div className="mt-2 text-3xl font-black">{productivity}%</div>
            </div>
            <button onClick={() => openCreateModal()} className="agile-action-button rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-left font-black text-white shadow-2xl shadow-cyan-500/20 hover:-translate-y-1">
              <Plus className="mb-3 h-5 w-5 text-white" /> Nova tarefa
            </button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(stat.route)}
              className="model5-stat model5-card-hover group rounded-[28px] p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              aria-label={`Abrir visão: ${stat.label}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-slate-200/60 transition group-hover:scale-105 dark:bg-white/10 dark:ring-white/10">
                  <Icon className={`h-6 w-6 ${stat.tone}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500 dark:text-slate-300">
                <span className="inline-flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> {stat.delta}</span>
                <span className="inline-flex items-center gap-1 text-cyan-700 opacity-0 transition group-hover:opacity-100 dark:text-cyan-200">Abrir <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-400">{stat.hint}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="model5-panel rounded-[32px] p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Visão do projeto</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">Progresso do sprint por status e foco de execução.</p>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar qualquer tarefa..." className="w-full rounded-2xl border border-white/40 bg-white/70 py-3 pl-11 pr-4 text-sm outline-none backdrop-blur-xl dark:bg-white/10 dark:text-white" />
            </div>
          </div>

          <div className="space-y-5">
            {statusRows.map((row) => (
              <div key={row.label} className="rounded-3xl border border-slate-200/50 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
                <div className="model5-progress-track h-2.5 overflow-hidden rounded-full">
                  <div className={`model5-progress-fill h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: row.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="model5-panel rounded-[32px] p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Atividade recente</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">Ações que movem o fluxo.</p>
            </div>
            <Bot className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <button key={task.id} onClick={() => navigate(`/tarefas/${task.id}`)} className="flex w-full items-center gap-3 rounded-3xl border border-slate-200/50 bg-white/45 p-3 text-left hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 text-white">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{statusLabel(task.status)} • {formatDate(task.date)}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="model5-panel rounded-[32px] p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Próximas prioridades</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">Clique para abrir detalhes e gerar plano com IA.</p>
          </div>
          <button onClick={() => navigate("/tarefas")} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Ver todas</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task, index) => (
            <motion.button key={task.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => navigate(`/tarefas/${task.id}`)} className="model5-card-hover overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/58 p-5 text-left backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
              <div className="mb-4 flex items-center justify-between">
                <span className={priorityTone(task.priority)}>{task.priority}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300">{task.estimatedTime || "sem tempo"}</span>
              </div>
              <h3 className="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">{task.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{task.description || "Abra para criar um roteiro de execução com IA."}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {statusLabel(task.status)}</span>
                <span className="inline-flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" /> {formatDate(task.date)}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

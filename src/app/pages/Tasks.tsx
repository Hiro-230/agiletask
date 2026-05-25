import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Flag,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Task, useTasks } from "../context/TaskContext";

function statusLabel(status: Task["status"]) {
  if (status === "done") return "Concluída";
  if (status === "inProgress") return "Em andamento";
  return "A fazer";
}

function statusTone(status: Task["status"]) {
  if (status === "done") return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-300/20";
  if (status === "inProgress") return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-400/15 dark:text-cyan-200 dark:border-cyan-300/20";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10";
}

function priorityTone(priority: Task["priority"]) {
  if (priority === "Alta") return "agile-priority-badge agile-priority-alta";
  if (priority === "Média") return "agile-priority-badge agile-priority-media";
  return "agile-priority-badge agile-priority-baixa";
}

function formatDate(date: string) {
  try { return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); } catch { return date; }
}

function TaskCard({ task, onOpen, onEdit, onDelete, onToggleDone, menuOpen, setMenuOpen }: {
  task: Task;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      onClick={onOpen}
      className="model5-panel model5-card-hover group relative cursor-pointer overflow-hidden rounded-[30px] p-5"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-400" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="flex items-start gap-4">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all ${task.status === "done" ? "border-emerald-300/30 bg-emerald-400 text-slate-950" : "border-slate-300/50 bg-white/60 text-transparent hover:text-cyan-500 dark:border-white/15 dark:bg-white/10"}`}
        >
          <Check className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(task.status)}`}>{statusLabel(task.status)}</span>
            <span className={priorityTone(task.priority)}>{task.priority}</span>
          </div>
          <h3 className={`text-xl font-black tracking-tight text-slate-950 dark:text-white ${task.status === "done" ? "line-through decoration-emerald-300/70 opacity-60" : ""}`}>{task.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{task.description || "Clique para abrir planejamento, dicas e roteiro com IA."}</p>
        </div>

        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="rounded-2xl p-2 text-slate-400 hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white">
            <MoreVertical className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <motion.div initial={{ opacity: 0, scale: 0.94, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -6 }} className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-white/20 bg-white/90 p-1 shadow-2xl backdrop-blur-2xl dark:bg-slate-950/95">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"><Edit2 className="h-4 w-4 text-white" /> Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/15"><Trash2 className="h-4 w-4" /> Excluir</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200/50 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/50 px-3 py-2 dark:bg-white/10"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.date)}</span>
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/50 px-3 py-2 dark:bg-white/10"><Timer className="h-3.5 w-3.5" /> {task.estimatedTime || "—"}</span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-cyan-400/12 px-3 py-2 text-cyan-700 dark:text-cyan-100"><ArrowUpRight className="h-3.5 w-3.5" /> plano</span>
      </div>
    </motion.article>
  );
}

export function Tasks() {
  const { openCreateModal } = useOutletContext<{ openCreateModal: (id?: string) => void }>();
  const navigate = useNavigate();
  const { tasks, deleteTask, updateTaskStatus } = useTasks();
  const [filter, setFilter] = useState<"all" | "todo" | "inProgress" | "done">("all");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.status !== "done").length,
    done: tasks.filter((task) => task.status === "done").length,
    high: tasks.filter((task) => task.priority === "Alta" && task.status !== "done").length,
  }), [tasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const normalized = search.toLowerCase().trim();
    const matchesSearch = !normalized || [task.title, task.description, task.category, task.priority, task.estimatedTime, task.date].join(" ").toLowerCase().includes(normalized);
    return matchesFilter && matchesSearch;
  });

  const tabs = [
    { id: "all", label: "Todas", count: stats.total },
    { id: "todo", label: "A Fazer", count: tasks.filter((t) => t.status === "todo").length },
    { id: "inProgress", label: "Em andamento", count: tasks.filter((t) => t.status === "inProgress").length },
    { id: "done", label: "Concluídas", count: stats.done },
  ] as const;

  return (
    <div className="space-y-7">
      <section className="model5-hero p-7 text-white md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="model5-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-100"><Sparkles className="h-4 w-4" /> Tarefas ágeis</div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Todas as tarefas</h1>
            <p className="mt-3 max-w-2xl text-sky-50/85">Gerencie o fluxo com cards claros, filtros rápidos e detalhes com planejamento por IA.</p>
          </div>
          <button onClick={() => openCreateModal()} className="agile-action-button inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 font-black text-white shadow-2xl shadow-cyan-500/20 hover:-translate-y-1"><Plus className="h-5 w-5 text-white" /> Nova tarefa</button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[{ label: "Total", value: stats.total }, { label: "Pendentes", value: stats.pending }, { label: "Concluídas", value: stats.done }, { label: "Alta prioridade", value: stats.high }].map((item) => (
          <div key={item.label} className="model5-stat rounded-[26px] p-5"><p className="text-sm font-bold text-slate-500 dark:text-slate-300">{item.label}</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{item.value}</p></div>
        ))}
      </div>

      <section className="model5-panel rounded-[32px] p-5 md:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2 rounded-[22px] bg-white/35 p-1.5 dark:bg-white/[0.05]">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`rounded-2xl px-4 py-2 text-sm font-black transition-all ${filter === tab.id ? "bg-slate-950 text-white shadow-xl dark:bg-white dark:text-slate-950" : "text-slate-500 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10"}`}>{tab.label} <span className="ml-1 opacity-70">{tab.count}</span></button>
            ))}
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefas..." className="w-full rounded-2xl border border-white/40 bg-white/65 py-3 pl-11 pr-10 text-sm outline-none backdrop-blur-xl dark:bg-white/10 dark:text-white" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300/70 bg-white/30 p-12 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <Clock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Nenhuma tarefa encontrada</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Crie uma nova tarefa ou limpe os filtros.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={() => navigate(`/tarefas/${task.id}`)}
                  onEdit={() => openCreateModal(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onToggleDone={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                  menuOpen={openMenuId === task.id}
                  setMenuOpen={(open) => setOpenMenuId(open ? task.id : null)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

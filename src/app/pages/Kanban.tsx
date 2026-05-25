import { DragEvent, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, Clock, KanbanSquare, Plus, Sparkles, Timer, Zap } from "lucide-react";
import { Task, useTasks } from "../context/TaskContext";

const columns: Array<{ id: Task["status"]; title: string; subtitle: string; icon: typeof Clock }> = [
  { id: "todo", title: "A Fazer", subtitle: "entrada do fluxo", icon: Calendar },
  { id: "inProgress", title: "Em andamento", subtitle: "execução ativa", icon: Zap },
  { id: "done", title: "Concluídas", subtitle: "entregas finais", icon: CheckCircle2 },
];

function priorityTone(priority: Task["priority"]) {
  if (priority === "Alta") return "agile-priority-badge agile-priority-alta";
  if (priority === "Média") return "agile-priority-badge agile-priority-media";
  return "agile-priority-badge agile-priority-baixa";
}

function formatDate(date: string) {
  try { return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); } catch { return date; }
}

export function Kanban() {
  const { tasks, updateTaskStatus } = useTasks();
  const navigate = useNavigate();
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);
  const { openCreateModal } = useOutletContext<{ openCreateModal: (id?: string) => void }>();

  const totalActive = useMemo(() => tasks.filter((task) => task.status !== "done").length, [tasks]);

  const handleDragStart = (event: DragEvent<HTMLElement>, taskId: string) => {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, status: Task["status"]) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, status: Task["status"]) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    setDragOverColumn(null);
    if (!taskId) return;
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === status) return;
    updateTaskStatus(taskId, status);
  };

  return (
    <div className="space-y-7">
      <section className="model5-hero p-7 text-white md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="model5-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-100"><KanbanSquare className="h-4 w-4" /> workflow visual</div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Kanban de sprint</h1>
            <p className="mt-3 max-w-2xl text-sky-50/85">Arraste o olhar pelo fluxo: entrada, execução e conclusão em um quadro visual inspirado em movimento ágil.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="model5-chip rounded-3xl p-4"><p className="text-xs font-black uppercase tracking-widest text-cyan-100/70">Ativas</p><p className="mt-2 text-3xl font-black">{totalActive}</p></div>
            <button onClick={() => openCreateModal()} className="agile-action-button rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-left font-black text-white shadow-2xl shadow-cyan-500/20 hover:-translate-y-1"><Plus className="mb-3 h-5 w-5 text-white" /> Nova</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {columns.map((column, columnIndex) => {
          const Icon = column.icon;
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <motion.section key={column.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: columnIndex * 0.06 }} onDragOver={(event) => handleDragOver(event, column.id)} onDragLeave={() => setDragOverColumn(null)} onDrop={(event) => handleDrop(event, column.id)} className={`model5-panel min-h-[540px] rounded-[34px] p-5 transition-colors ${dragOverColumn === column.id ? "agile-kanban-drop-active" : ""}`}>
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-xl shadow-sky-500/20"><Icon className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{column.title}</h2>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{column.subtitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white/65 px-3 py-1 text-sm font-black text-slate-700 ring-1 ring-slate-200/60 dark:bg-white/10 dark:text-white dark:ring-white/10">{columnTasks.length}</span>
              </div>

              <div className="space-y-4">
                {columnTasks.map((task, index) => (
                  <motion.article key={task.id} draggable onDragStart={(event) => handleDragStart(event, task.id)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => navigate(`/tarefas/${task.id}`)} className="model5-card-hover cursor-grab overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/58 p-4 active:cursor-grabbing dark:border-white/10 dark:bg-white/[0.06]">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className={priorityTone(task.priority)}>{task.priority}</span>
                      <div className="flex gap-1">
                        {column.id !== "todo" && <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, "todo"); }} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/70 hover:text-cyan-700 dark:hover:bg-white/10 dark:hover:text-cyan-100" title="Mover para A Fazer"><Calendar className="h-4 w-4" /></button>}
                        {column.id !== "inProgress" && <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, "inProgress"); }} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/70 hover:text-violet-500 dark:hover:bg-white/10" title="Mover para Em andamento"><Clock className="h-4 w-4" /></button>}
                        {column.id !== "done" && <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, "done"); }} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/70 hover:text-emerald-500 dark:hover:bg-white/10" title="Concluir"><CheckCircle2 className="h-4 w-4" /></button>}
                      </div>
                    </div>
                    <h3 className={`text-base font-black leading-snug text-slate-950 dark:text-white ${task.status === "done" ? "line-through decoration-emerald-300/70 opacity-60" : ""}`}>{task.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{task.description || "Sem descrição. Abra para detalhar com IA."}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
                      <span className="rounded-2xl bg-white/55 px-2.5 py-1 dark:bg-white/10">{task.category}</span>
                      <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {task.estimatedTime || "—"}</span>
                    </div>
                  </motion.article>
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex min-h-[230px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300/70 bg-white/30 p-8 text-center dark:border-white/15 dark:bg-white/[0.03]">
                    <Sparkles className="mb-3 h-10 w-10 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Nenhuma tarefa aqui</p>
                  </div>
                )}
              </div>

              <button onClick={() => openCreateModal()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200/70 bg-white/65 py-3 text-sm font-black text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"><Plus className="h-4 w-4" /> Adicionar tarefa</button>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

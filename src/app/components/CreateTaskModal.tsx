import { useEffect, useState } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useTasks, Task } from "../context/TaskContext";
import { motion, AnimatePresence } from "motion/react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string; // If passed, edit mode
}

export function CreateTaskModal({ isOpen, onClose, taskId }: CreateTaskModalProps) {
  const { tasks, addTask, updateTask } = useTasks();
  
  const [formData, setFormData] = useState({
    title: "",
    category: "Trabalho",
    priority: "Média" as Task["priority"],
    date: new Date().toISOString().split("T")[0],
    estimatedTime: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (taskId) {
        const taskToEdit = tasks.find(t => t.id === taskId);
        if (taskToEdit) {
          setFormData({
            title: taskToEdit.title,
            category: taskToEdit.category,
            priority: taskToEdit.priority,
            date: taskToEdit.date,
            estimatedTime: taskToEdit.estimatedTime,
            description: taskToEdit.description,
          });
        }
      } else {
        setFormData({
          title: "",
          category: "Trabalho",
          priority: "Média",
          date: new Date().toISOString().split("T")[0],
          estimatedTime: "",
          description: "",
        });
      }
    }
  }, [isOpen, taskId, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (taskId) {
      updateTask(taskId, formData);
    } else {
      addTask(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-6 bg-slate-950/60 backdrop-blur-md sm:items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="model5-panel max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/20 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/55 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              {taskId ? "Editar Tarefa" : "Criar Nova Tarefa"}
            </h2>
            <button 
              onClick={onClose}
              type="button"
              className="rounded-2xl border border-transparent p-2 text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:bg-white hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="max-h-[calc(100vh-220px)] space-y-5 overflow-y-auto p-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Título da Tarefa</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Revisar relatório trimestral"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-slate-700 dark:text-slate-100 appearance-none"
                  >
                    <option>Estudos</option>
                    <option>Trabalho</option>
                    <option>Design</option>
                    <option>Reunião</option>
                    <option>Pessoal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Prioridade</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as Task["priority"]})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-slate-700 dark:text-slate-100 appearance-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Data</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Tempo Estimado</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Ex: 2h 30m"
                      value={formData.estimatedTime}
                      onChange={e => setFormData({...formData, estimatedTime: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Descrição <span className="text-slate-400 font-normal">(Opcional)</span></label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Adicione detalhes, links ou checklists aqui..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-slate-700 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200/60 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <button 
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="agile-action-button rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {taskId ? "Salvar Alterações" : "Criar Tarefa"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

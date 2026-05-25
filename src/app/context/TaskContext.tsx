import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "Alta" | "Média" | "Baixa";
  date: string;
  estimatedTime: string;
  status: "todo" | "inProgress" | "done";
  createdAt: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "status">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Definir paleta de cores do projeto",
    description: "Analisar referências e definir o design system",
    category: "Design",
    priority: "Alta",
    date: new Date().toISOString().split("T")[0],
    estimatedTime: "2h",
    status: "todo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Desenvolvimento do Dashboard",
    description: "Implementar gráficos e cards informativos",
    category: "Trabalho",
    priority: "Alta",
    date: new Date().toISOString().split("T")[0],
    estimatedTime: "4h",
    status: "inProgress",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Reunião de kickoff com cliente",
    description: "Alinhar expectativas e prazos",
    category: "Reunião",
    priority: "Média",
    date: new Date().toISOString().split("T")[0],
    estimatedTime: "1h",
    status: "done",
    createdAt: new Date().toISOString(),
  }
];

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("@AgileTask:tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialTasks;
      }
    }
    return initialTasks;
  });

  useEffect(() => {
    localStorage.setItem("@AgileTask:tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData: Omit<Task, "id" | "createdAt" | "status">): Task => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "todo",
    };
    setTasks((prev) => [newTask, ...prev]);
    toast.success("Tarefa criada com sucesso!");
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    toast.success("Tarefa atualizada!");
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.info("Tarefa excluída.");
  };

  const updateTaskStatus = (id: string, status: Task["status"]) => {
    setTasks((prev) => 
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    if (status === "done") {
      toast.success("Tarefa concluída! 🎉");
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}

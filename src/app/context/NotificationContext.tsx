import { createContext, useContext, useState, ReactNode } from "react";

export type NotificationCategory = "tarefa" | "lembrete" | "sistema" | "ia";

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  time: string;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const initialNotifications: Notification[] = [
  {
    id: "n1",
    title: "Tarefa com prazo hoje",
    message: "\"Definir paleta de cores do projeto\" vence hoje.",
    category: "lembrete",
    read: false,
    time: "08:30",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "n2",
    title: "Tarefa concluída",
    message: "\"Reunião de kickoff com cliente\" foi marcada como concluída.",
    category: "tarefa",
    read: false,
    time: "09:15",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "n3",
    title: "Sugestão do Roby",
    message: "Você tem 2 tarefas de Alta prioridade pendentes. Deseja revisar agora?",
    category: "ia",
    read: false,
    time: "09:45",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "n4",
    title: "Bem-vindo ao AgileTask!",
    message: "Configure seu perfil e conecte a IA para uma experiência completa.",
    category: "sistema",
    read: true,
    time: "Ontem",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<Notification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [
      {
        ...n,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

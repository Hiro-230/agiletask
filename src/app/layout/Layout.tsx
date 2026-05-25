import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { useState, useRef, useEffect } from "react";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { Bell, Menu, X, CheckCheck, Trash2, Plus } from "lucide-react";
import { TaskProvider } from "../context/TaskContext";
import {
  NotificationProvider,
  useNotifications,
  NotificationCategory,
} from "../context/NotificationContext";
import { Toaster } from "sonner";

const categoryMeta: Record<
  NotificationCategory,
  { label: string; color: string; bg: string }
> = {
  tarefa: { label: "Tarefa", color: "text-blue-700", bg: "bg-blue-100" },
  lembrete: { label: "Lembrete", color: "text-amber-700", bg: "bg-amber-100" },
  sistema: { label: "Sistema", color: "text-slate-700", bg: "bg-slate-100" },
  ia: { label: "IA Roby", color: "text-indigo-700", bg: "bg-indigo-100" },
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<
    NotificationCategory | "todas"
  >("todas");

  const filtered =
    activeFilter === "todas"
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const categories: Array<{
    value: NotificationCategory | "todas";
    label: string;
  }> = [
    { value: "todas", label: "Todas" },
    { value: "tarefa", label: "Tarefas" },
    { value: "lembrete", label: "Lembretes" },
    { value: "ia", label: "IA Roby" },
    { value: "sistema", label: "Sistema" },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900">Notificações</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Marcar todas como lidas"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveFilter(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === c.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Nenhuma notificação aqui
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((n) => {
              const meta = categoryMeta[n.category];
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group ${!n.read ? "bg-blue-50/40" : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div
                    className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${!n.read ? "bg-blue-500" : "bg-transparent"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 rounded transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              notifications.forEach((n) => removeNotification(n.id));
            }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Limpar todas
          </button>
        </div>
      )}
    </div>
  );
}

function LayoutInner() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(
    () => localStorage.getItem("@AgileTask:profilePhoto") || "",
  );
  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("@AgileTask:name") || "A",
  );
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  const openCreateModal = (taskId?: string) => {
    setEditingTaskId(taskId);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setTimeout(() => setEditingTaskId(undefined), 200);
  };

  useEffect(() => {
    const syncProfile = () => {
      setProfilePhoto(localStorage.getItem("@AgileTask:profilePhoto") || "");
      setProfileName(localStorage.getItem("@AgileTask:name") || "A");
    };

    window.addEventListener("storage", syncProfile);
    window.addEventListener("agiletask-profile-updated", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("agiletask-profile-updated", syncProfile);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="agile-premium-shell model5-shell relative min-h-screen overflow-x-hidden flex font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-100">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_72%_16%,rgba(248,113,113,.16),transparent_22%),radial-gradient(circle_at_55%_14%,rgba(125,211,252,.28),transparent_28%),linear-gradient(180deg,rgba(186,230,253,.22),transparent)]" />
        <div className="model5-mountain absolute right-0 top-16 h-[340px] w-[72vw] opacity-80" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute right-10 top-10 h-80 w-80 rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative z-10 flex-1 lg:ml-72 min-w-0 flex flex-col min-h-screen transition-all duration-300">
        <div className="lg:hidden sticky top-0 z-20 mx-3 mt-3 flex items-center justify-between rounded-3xl border border-white/60 bg-white/75 p-3 shadow-2xl shadow-blue-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-2xl text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 font-extrabold text-slate-950 dark:text-white tracking-tight">
            <span className="h-8 w-8 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-violet-600 shadow-lg shadow-blue-500/30" />
            AGILETASK
          </div>
          <div className="flex items-center gap-2">
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-200 hover:scale-105 relative transition-all shadow-sm"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profileName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[1480px] w-full mx-auto p-4 sm:p-6 lg:p-8 bg-transparent">
          <Outlet
            context={{
              openCreateModal,
              showNotifications,
              setShowNotifications,
              notifRef,
            }}
          />
        </div>
      </main>


      <button
        onClick={() => openCreateModal()}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-sm font-black text-white shadow-2xl shadow-cyan-500/25 ring-1 ring-white/30 hover:-translate-y-1 active:translate-y-0"
        aria-label="Criar nova tarefa"
      >
        <Plus className="h-5 w-5" />
        Nova tarefa
      </button>

      <CreateTaskModal isOpen={isCreateModalOpen} onClose={closeCreateModal} taskId={editingTaskId} />
      <Toaster position="top-right" richColors toastOptions={{ style: { borderRadius: "16px" } }} />
    </div>
  );
}

export function Layout() {
  return (
    <TaskProvider>
      <NotificationProvider>
        <LayoutInner />
      </NotificationProvider>
    </TaskProvider>
  );
}

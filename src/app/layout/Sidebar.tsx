import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  CheckSquare,
  KanbanSquare,
  Bot,
  Settings,
  LogOut,
  X,
  Sparkles,
  ChevronRight,
  Gauge,
  UserCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", hint: "visão" },
  { icon: CheckSquare, label: "Tarefas", path: "/tarefas", hint: "execução" },
  { icon: KanbanSquare, label: "Kanban", path: "/kanban", hint: "fluxo" },
  { icon: Bot, label: "Roby IA", path: "/ai-assistant", hint: "agente" },
  { icon: Settings, label: "Configurações", path: "/configuracoes", hint: "sistema" },
];

type ProfileStatus = "online" | "focus" | "busy" | "offline";

const statusView: Record<ProfileStatus, { label: string; dot: string; helper: string }> = {
  online: { label: "Online agora", dot: "bg-emerald-300", helper: "Clique para editar o perfil" },
  focus: { label: "Em foco", dot: "bg-cyan-300", helper: "Modo concentração ativo" },
  busy: { label: "Ocupado", dot: "bg-amber-300", helper: "Disponibilidade reduzida" },
  offline: { label: "Offline", dot: "bg-slate-400", helper: "Aparece como indisponível" },
};

function normalizeProfileStatus(value: string | null): ProfileStatus {
  return value === "focus" || value === "busy" || value === "offline" || value === "online" ? value : "online";
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [profileName, setProfileName] = useState(() => localStorage.getItem("@AgileTask:name") || "Gabriel");
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem("@AgileTask:profilePhoto") || "");
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(() => normalizeProfileStatus(localStorage.getItem("@AgileTask:profileStatus")));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const sync = () => {
      setProfileName(localStorage.getItem("@AgileTask:name") || "Gabriel");
      setProfilePhoto(localStorage.getItem("@AgileTask:profilePhoto") || "");
      setProfileStatus(normalizeProfileStatus(localStorage.getItem("@AgileTask:profileStatus")));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("agiletask-profile-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("agiletask-profile-updated", sync);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  const openProfileSettings = () => {
    navigate("/configuracoes?tab=perfil");
    onClose();
    toast.info("Perfil aberto. Edite foto, nome e status aqui.");
  };

  const isActivePath = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const sidebarContent = (
    <aside className="model5-sidebar fixed left-0 top-0 z-40 flex h-screen w-72 flex-col overflow-hidden border-r border-white/10 text-white shadow-2xl shadow-slate-950/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(125,211,252,.22),transparent_27%),radial-gradient(circle_at_85%_3%,rgba(236,72,153,.16),transparent_25%),linear-gradient(165deg,rgba(15,35,63,.98),rgba(3,7,18,.96)_58%,rgba(8,19,38,.98))]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 opacity-80 [clip-path:polygon(0_60%,18%_38%,31%_55%,47%_30%,62%_52%,78%_24%,100%_48%,100%_100%,0_100%)] bg-gradient-to-t from-cyan-500/15 via-sky-400/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-5 top-24 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <div className="relative flex items-center justify-between px-6 pb-5 pt-7">
        <Link to="/" className="group flex items-center gap-3" onClick={onClose}>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15 backdrop-blur-xl shadow-[0_0_32px_rgba(56,189,248,.22)]">
            <div className="absolute inset-1 rounded-[20px] bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 opacity-95" />
            <Gauge className="relative h-6 w-6 text-white drop-shadow" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">AGILE<span className="text-cyan-200">TASK</span></div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-100/60">flow system</div>
          </div>
        </Link>
        {isMobile && (
          <button onClick={onClose} className="rounded-2xl p-2 text-white/65 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={openProfileSettings}
        className="group relative mx-5 mb-5 block overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.07] p-4 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
        title="Abrir perfil e status"
      >
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-300 to-violet-500 ring-2 ring-white/10 flex items-center justify-center font-black text-white">
            {profilePhoto ? <img src={profilePhoto} className="h-full w-full object-cover" alt="Perfil" /> : profileName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{profileName}</div>
            <div className="flex items-center gap-1 text-xs text-cyan-100/70"><span className={`h-1.5 w-1.5 rounded-full ${statusView[profileStatus].dot}`} /> {statusView[profileStatus].label}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 opacity-0 transition-opacity group-hover:opacity-100">{statusView[profileStatus].helper}</div>
          </div>
          <UserCircle className="h-5 w-5 text-cyan-100/55 transition-colors group-hover:text-cyan-100" />
        </div>
      </button>

      <nav className="relative flex-1 space-y-1.5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-white/14 text-white ring-1 ring-white/16 shadow-[0_16px_48px_rgba(14,165,233,.18)]"
                  : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="model5-active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/18 via-blue-500/16 to-fuchsia-500/12"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-2xl ${active ? "bg-cyan-300/18 text-cyan-100" : "bg-white/[0.06] text-slate-300 group-hover:text-cyan-100"}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="relative flex-1">
                {item.label}
                <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{item.hint}</span>
              </span>
              {active && <ChevronRight className="relative h-4 w-4 text-cyan-100" />}
            </Link>
          );
        })}
      </nav>

      <div className="relative m-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-fuchsia-400/15 blur-2xl" />
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">
          <Sparkles className="h-4 w-4" /> Sprint ativo
        </div>
        <div className="text-2xl font-black">Fluxo ágil</div>
        <p className="mt-1 text-xs leading-5 text-slate-300/80">Planeje, priorize e execute tarefas com IA.</p>
      </div>

      <div className="relative border-t border-white/10 p-5">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-200">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {isMobile ? (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      ) : (
        sidebarContent
      )}
    </>
  );
}

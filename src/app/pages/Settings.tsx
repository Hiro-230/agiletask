import { useRef, useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Eye,
  EyeOff,
  Bot,
  CheckCircle2,
  Trash2,
  Download,
  Camera,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTasks } from "../context/TaskContext";
import { useAppearance } from "../context/AppearanceContext";

type SettingsTab = "perfil" | "notificacoes" | "ia" | "aparencia" | "dados";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "deepseek-r1:1.5b";
const API_ONLY_DEEPSEEK_MODELS = new Set([
  "deepseek-chat",
  "deepseek-reasoner",
  "deepseek-coder",
  "deepseek-v3",
]);

function normalizeOllamaModel(value?: string | null): string {
  const model = (value || "").trim();

  // deepseek-chat/deepseek-reasoner são nomes da API online da DeepSeek.
  // No Ollama local, o modelo instalado no computador é deepseek-r1:8b.
  if (!model || API_ONLY_DEEPSEEK_MODELS.has(model)) {
    localStorage.setItem("@AgileTask:aiModel", DEFAULT_OLLAMA_MODEL);
    return DEFAULT_OLLAMA_MODEL;
  }

  return model;
}

function normalizeOllamaUrl(value?: string | null): string {
  const url = (value || "").trim().replace(/\/$/, "");
  const finalUrl = url || DEFAULT_OLLAMA_URL;
  localStorage.setItem("@AgileTask:ollamaUrl", finalUrl);
  return finalUrl;
}

export function Settings() {
  const { tasks } = useTasks();
  const { updateAppearance } = useAppearance();
  const [activeTab, setActiveTab] = useState<SettingsTab>("perfil");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile
  const [profilePhoto, setProfilePhoto] = useState(
    () => localStorage.getItem("@AgileTask:profilePhoto") || "",
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    () => localStorage.getItem("@AgileTask:twoFactorEnabled") === "true",
  );
  const [twoFactorCode, setTwoFactorCode] = useState(
    () => localStorage.getItem("@AgileTask:twoFactorCode") || "",
  );
  const [name, setName] = useState(
    () => localStorage.getItem("@AgileTask:name") || "Estefani",
  );
  const [email, setEmail] = useState(
    () => localStorage.getItem("@AgileTask:email") || "estefani@exemplo.com",
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("@AgileTask:role") || "Designer de Produto",
  );
  const [newPassword, setNewPassword] = useState("");

  // IA local com Ollama
  const [useOllama, setUseOllama] = useState(
    () => localStorage.getItem("@AgileTask:useOllama") !== "false",
  );
  const [ollamaUrl, setOllamaUrl] = useState(
    () => normalizeOllamaUrl(localStorage.getItem("@AgileTask:ollamaUrl")),
  );
  const [aiModel, setAiModel] = useState(
    () => normalizeOllamaModel(localStorage.getItem("@AgileTask:aiModel")),
  );

  // Notifications
  const [notifTasks, setNotifTasks] = useState(
    () => localStorage.getItem("@AgileTask:notifTasks") !== "false",
  );
  const [notifReminders, setNotifReminders] = useState(
    () => localStorage.getItem("@AgileTask:notifReminders") !== "false",
  );
  const [notifAI, setNotifAI] = useState(
    () => localStorage.getItem("@AgileTask:notifAI") !== "false",
  );

  // Appearance
  const [theme, setTheme] = useState(
    () => localStorage.getItem("@AgileTask:theme") || "light",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("@AgileTask:accent") || "blue",
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("@AgileTask:fontSize") || "medium",
  );

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || "");
      setProfilePhoto(imageUrl);
      localStorage.setItem("@AgileTask:profilePhoto", imageUrl);
      window.dispatchEvent(new Event("agiletask-profile-updated"));
      toast.success("Foto de perfil atualizada!");
    };
    reader.onerror = () => toast.error("Não foi possível carregar a imagem.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleTwoFactorToggle = () => {
    if (twoFactorEnabled) {
      setTwoFactorEnabled(false);
      setTwoFactorCode("");
      localStorage.setItem("@AgileTask:twoFactorEnabled", "false");
      localStorage.removeItem("@AgileTask:twoFactorCode");
      toast.success("Autenticação em dois fatores desativada.");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setTwoFactorEnabled(true);
    setTwoFactorCode(code);
    localStorage.setItem("@AgileTask:twoFactorEnabled", "true");
    localStorage.setItem("@AgileTask:twoFactorCode", code);
    toast.success(`2FA ativada! Código de demonstração: ${code}`);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    updateAppearance(newTheme, accentColor, fontSize);
  };

  const handleAccentChange = (newAccent: string) => {
    setAccentColor(newAccent);
    updateAppearance(theme, newAccent, fontSize);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    updateAppearance(theme, accentColor, newSize);
  };

  const handleSave = () => {
    // Save profile
    localStorage.setItem("@AgileTask:name", name);
    localStorage.setItem("@AgileTask:email", email);
    localStorage.setItem("@AgileTask:role", role);
    localStorage.setItem("@AgileTask:profilePhoto", profilePhoto);
    localStorage.setItem(
      "@AgileTask:twoFactorEnabled",
      String(twoFactorEnabled),
    );
    if (twoFactorCode) {
      localStorage.setItem("@AgileTask:twoFactorCode", twoFactorCode);
    }
    localStorage.setItem(
      "@AgileTask:currentUser",
      JSON.stringify({ name, email, role }),
    );
    window.dispatchEvent(new Event("agiletask-profile-updated"));

    // Save password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      localStorage.setItem("@AgileTask:password", newPassword);
      setNewPassword("");
      toast.success("Senha alterada com sucesso!");
    }

    // Save local AI settings
    localStorage.setItem("@AgileTask:useOllama", String(useOllama));
    const fixedOllamaUrl = normalizeOllamaUrl(ollamaUrl);
    const fixedAiModel = normalizeOllamaModel(aiModel);
    setOllamaUrl(fixedOllamaUrl);
    setAiModel(fixedAiModel);
    localStorage.setItem("@AgileTask:ollamaUrl", fixedOllamaUrl);
    localStorage.setItem("@AgileTask:aiModel", fixedAiModel);

    // Save notifications
    localStorage.setItem("@AgileTask:notifTasks", String(notifTasks));
    localStorage.setItem("@AgileTask:notifReminders", String(notifReminders));
    localStorage.setItem("@AgileTask:notifAI", String(notifAI));

    // Save appearance
    localStorage.setItem("@AgileTask:theme", theme);
    localStorage.setItem("@AgileTask:accent", accentColor);
    localStorage.setItem("@AgileTask:fontSize", fontSize);

    // Update appearance in real-time
    updateAppearance(theme, accentColor, fontSize);

    setSaved(true);
    toast.success("Configurações salvas com sucesso!");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      tasks,
      exportedAt: new Date().toISOString(),
      user: { name, email, role },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agiletask-backup-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso!");
  };

  const handleClearData = () => {
    if (
      confirm(
        "Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.",
      )
    ) {
      // Clear all AgileTask data
      const keysToRemove = Object.keys(localStorage).filter((key) =>
        key.startsWith("@AgileTask:"),
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      toast.success("Todos os dados foram apagados. Recarregando...");

      // Force reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const tabs = [
    { id: "perfil" as SettingsTab, label: "Perfil", icon: User },
    { id: "notificacoes" as SettingsTab, label: "Notificações", icon: Bell },
    { id: "ia" as SettingsTab, label: "IA & API", icon: Bot },
    { id: "aparencia" as SettingsTab, label: "Aparência", icon: Palette },
    { id: "dados" as SettingsTab, label: "Dados", icon: Database },
  ];

  const accentColors = [
    { name: "blue", label: "Azul", hex: "#2563eb" },
    { name: "indigo", label: "Índigo", hex: "#4f46e5" },
    { name: "violet", label: "Violeta", hex: "#7c3aed" },
    { name: "emerald", label: "Verde", hex: "#059669" },
    { name: "amber", label: "Âmbar", hex: "#d97706" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">
            Gerencie suas preferências e conta.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
        >
          {saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="lg:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex lg:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                  ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <tab.icon
                  className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? "text-blue-600" : "text-slate-400"}`}
                />
                <span className="hidden sm:block lg:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* PERFIL */}
          {activeTab === "perfil" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Informações do Perfil
              </h2>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200 overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="text-sm text-slate-500">{role}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 mt-1.5 hover:text-blue-700 font-medium"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Trocar foto
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Nome completo
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Cargo / Função
                  </label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-2">
                <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Shield
                    className={`w-5 h-5 shrink-0 ${twoFactorEnabled ? "text-emerald-600" : "text-slate-500"}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Autenticação em dois fatores
                    </p>
                    <p className="text-xs text-slate-500">
                      {twoFactorEnabled
                        ? `Ativada. Código de demonstração: ${twoFactorCode}`
                        : "Proteja sua conta com verificação adicional"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTwoFactorToggle}
                    className={`sm:ml-auto text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      twoFactorEnabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {twoFactorEnabled ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICAÇÕES */}
          {activeTab === "notificacoes" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Preferências de Notificação
              </h2>
              <div className="space-y-4">
                {[
                  {
                    label: "Notificações de Tarefas",
                    desc: "Receba alertas quando tarefas forem criadas, atualizadas ou concluídas",
                    value: notifTasks,
                    set: setNotifTasks,
                  },
                  {
                    label: "Lembretes",
                    desc: "Alertas de prazos e tarefas vencendo",
                    value: notifReminders,
                    set: setNotifReminders,
                  },
                  {
                    label: "Sugestões da IA",
                    desc: "Receba dicas e sugestões do assistente Roby",
                    value: notifAI,
                    set: setNotifAI,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.label}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${item.value ? "bg-blue-600" : "bg-slate-200"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${item.value ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* IA & API */}
          {activeTab === "ia" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Configurações de IA local
              </h2>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <Bot className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">
                    Roby conectado ao DeepSeek local pelo Ollama
                  </p>
                  <p className="text-emerald-700 mt-1">
                    Para funcionar de verdade, deixe o Ollama aberto no computador
                    e mantenha o modelo DeepSeek baixado. O padrão recomendado é
                    <strong> deepseek-r1:1.5b</strong> para respostas rápidas. Use <strong>deepseek-r1:8b</strong> apenas quando quiser mais qualidade e puder esperar mais.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Usar IA real local
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quando ligado, o Roby chama o Ollama em vez de usar respostas simuladas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseOllama(!useOllama)}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${useOllama ? "bg-emerald-600" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${useOllama ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Endereço local do Ollama
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400">
                    No Linux Mint, normalmente é: http://localhost:11434
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Modelo de IA instalado
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B — recomendado para apresentação rápida</option>
                    <option value="deepseek-r1:7b">DeepSeek R1 7B — qualidade boa, mais lento</option>
                    <option value="deepseek-r1:8b">DeepSeek R1 8B — qualidade melhor, mais pesado</option>
                    <option value="deepseek-r1:14b">DeepSeek R1 14B — mais pesado</option>
                  </select>
                  <p className="text-xs text-slate-400">
                    Se você baixou outro nome, use o mesmo nome mostrado em <code>ollama list</code>.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Antes de testar no Roby, confirme no terminal: <code>ollama list</code> e
                    <code> ollama run {aiModel}</code>. Depois salve estas configurações.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* APARÊNCIA */}
          {activeTab === "aparencia" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Aparência
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: "light",
                        label: "Claro",
                        preview: "bg-white border-slate-200",
                      },
                      {
                        value: "dark",
                        label: "Escuro",
                        preview: "bg-slate-800 border-slate-700",
                      },
                      {
                        value: "system",
                        label: "Sistema",
                        preview:
                          "bg-gradient-to-r from-white to-slate-800 border-slate-300",
                      },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => handleThemeChange(t.value)}
                        className={`border-2 rounded-xl p-3 text-center transition-all ${theme === t.value ? "border-blue-500 shadow-md shadow-blue-100" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <div
                          className={`${t.preview} border rounded-lg h-12 mb-2`}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">
                    Cor de Destaque
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {accentColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleAccentChange(c.name)}
                        title={c.label}
                        aria-label={`Selecionar cor ${c.label}`}
                        style={{ backgroundColor: c.hex }}
                        className={`w-9 h-9 rounded-xl border border-white/60 shadow-sm transition-all ${accentColor === c.name ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">
                    Tamanho da Fonte
                  </label>
                  <div className="flex gap-2">
                    {["small", "medium", "large"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleFontSizeChange(s)}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all ${fontSize === s ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {s === "small"
                          ? "Pequena"
                          : s === "medium"
                            ? "Média"
                            : "Grande"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DADOS */}
          {activeTab === "dados" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Gerenciamento de Dados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {tasks.length}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Total de Tarefas
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {tasks.filter((t) => t.status === "done").length}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">Concluídas</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {tasks.filter((t) => t.status !== "done").length}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">Pendentes</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      Exportar Dados
                    </p>
                    <p className="text-xs text-slate-500">
                      Baixe todas as suas tarefas em formato JSON
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleClearData}
                  className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">
                      Apagar Todos os Dados
                    </p>
                    <p className="text-xs text-red-400">
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

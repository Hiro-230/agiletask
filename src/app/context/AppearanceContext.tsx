import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AppearanceContextType {
  theme: string;
  accentColor: string;
  fontSize: string;
  updateAppearance: (theme: string, accent: string, size: string) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(
  undefined,
);

// Full shade maps for each accent color
const ACCENT_MAP: Record<
  string,
  {
    s50: string;
    s100: string;
    s200: string;
    s400: string;
    s500: string;
    s600: string;
    s700: string;
    s800: string;
  }
> = {
  blue: {
    s50: "#eff6ff",
    s100: "#dbeafe",
    s200: "#bfdbfe",
    s400: "#60a5fa",
    s500: "#3b82f6",
    s600: "#2563eb",
    s700: "#1d4ed8",
    s800: "#1e40af",
  },
  indigo: {
    s50: "#eef2ff",
    s100: "#e0e7ff",
    s200: "#c7d2fe",
    s400: "#818cf8",
    s500: "#6366f1",
    s600: "#4f46e5",
    s700: "#4338ca",
    s800: "#3730a3",
  },
  violet: {
    s50: "#f5f3ff",
    s100: "#ede9fe",
    s200: "#ddd6fe",
    s400: "#a78bfa",
    s500: "#8b5cf6",
    s600: "#7c3aed",
    s700: "#6d28d9",
    s800: "#5b21b6",
  },
  emerald: {
    s50: "#ecfdf5",
    s100: "#d1fae5",
    s200: "#a7f3d0",
    s400: "#34d399",
    s500: "#10b981",
    s600: "#059669",
    s700: "#047857",
    s800: "#065f46",
  },
  amber: {
    s50: "#fffbeb",
    s100: "#fef3c7",
    s200: "#fde68a",
    s400: "#fbbf24",
    s500: "#f59e0b",
    s600: "#d97706",
    s700: "#b45309",
    s800: "#92400e",
  },
};

const ACCENT_RGB: Record<string, string> = {
  blue: "59 130 246",
  indigo: "99 102 241",
  violet: "139 92 246",
  emerald: "16 185 129",
  amber: "245 158 11",
};

function buildCSS(isDark: boolean, accent: string): string {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.blue;
  const rgb = ACCENT_RGB[accent] || ACCENT_RGB.blue;

  const globalAccentCSS = `
    :root {
      --agile-accent-50: ${a.s50};
      --agile-accent-100: ${a.s100};
      --agile-accent-200: ${a.s200};
      --agile-accent-400: ${a.s400};
      --agile-accent-500: ${a.s500};
      --agile-accent-600: ${a.s600};
      --agile-accent-700: ${a.s700};
      --agile-accent-800: ${a.s800};
      --agile-accent-rgb: ${rgb};
    }

    /* Accent colors across the whole AgileTask UI. This makes Settings > Appearance truly affect the site colors. */
    .agile-premium-shell .from-cyan-300,
    .agile-premium-shell .from-cyan-400,
    .agile-premium-shell .from-cyan-500,
    .agile-premium-shell .from-sky-300,
    .agile-premium-shell .from-sky-400,
    .agile-premium-shell .from-blue-500,
    .agile-premium-shell .from-violet-400,
    .agile-premium-shell .from-emerald-300,
    .agile-premium-shell .from-amber-300 {
      --tw-gradient-from: ${a.s400} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .agile-premium-shell .via-blue-500,
    .agile-premium-shell .via-blue-600,
    .agile-premium-shell .via-sky-400\/10 {
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), ${a.s500} var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
    }
    .agile-premium-shell .to-blue-500,
    .agile-premium-shell .to-indigo-600,
    .agile-premium-shell .to-violet-500,
    .agile-premium-shell .to-violet-600,
    .agile-premium-shell .to-fuchsia-400,
    .agile-premium-shell .to-fuchsia-500,
    .agile-premium-shell .to-cyan-400 {
      --tw-gradient-to: ${a.s700} var(--tw-gradient-to-position) !important;
    }

    .agile-premium-shell .bg-cyan-300,
    .agile-premium-shell .bg-cyan-400,
    .agile-premium-shell .bg-blue-500,
    .agile-premium-shell .bg-blue-600,
    .agile-premium-shell .bg-indigo-500,
    .agile-premium-shell .bg-indigo-600,
    .agile-premium-shell .bg-violet-500,
    .agile-premium-shell .bg-violet-600 {
      background-color: ${a.s600} !important;
    }
    .agile-premium-shell .bg-blue-50,
    .agile-premium-shell .bg-indigo-50,
    .agile-premium-shell .bg-cyan-400\/10,
    .agile-premium-shell .bg-cyan-400\/12,
    .agile-premium-shell .bg-cyan-400\/15,
    .agile-premium-shell .bg-cyan-300\/18,
    .agile-premium-shell .bg-cyan-300\/20,
    .agile-premium-shell .bg-blue-50\/40 {
      background-color: color-mix(in srgb, ${a.s500} 15%, transparent) !important;
    }
    .agile-premium-shell .bg-blue-100,
    .agile-premium-shell .bg-indigo-100,
    .agile-premium-shell .bg-blue-200,
    .agile-premium-shell .bg-indigo-200 {
      background-color: color-mix(in srgb, ${a.s500} 24%, white) !important;
    }
    .agile-premium-shell .text-cyan-100,
    .agile-premium-shell .text-cyan-100\/60,
    .agile-premium-shell .text-cyan-100\/65,
    .agile-premium-shell .text-cyan-100\/70,
    .agile-premium-shell .text-cyan-200,
    .agile-premium-shell .text-cyan-400,
    .agile-premium-shell .text-cyan-500,
    .agile-premium-shell .text-cyan-700,
    .agile-premium-shell .text-sky-500,
    .agile-premium-shell .text-blue-400,
    .agile-premium-shell .text-blue-500,
    .agile-premium-shell .text-blue-600,
    .agile-premium-shell .text-blue-700,
    .agile-premium-shell .text-indigo-400,
    .agile-premium-shell .text-indigo-500,
    .agile-premium-shell .text-indigo-600,
    .agile-premium-shell .text-indigo-700,
    .agile-premium-shell .text-violet-500 {
      color: ${a.s400} !important;
    }
    .agile-premium-shell .border-cyan-300\/20,
    .agile-premium-shell .border-blue-300,
    .agile-premium-shell .border-blue-500,
    .agile-premium-shell .border-blue-600,
    .agile-premium-shell .border-indigo-500,
    .agile-premium-shell .border-indigo-600,
    .agile-premium-shell .border-indigo-700 {
      border-color: color-mix(in srgb, ${a.s500} 55%, transparent) !important;
    }
    .agile-premium-shell .ring-blue-500,
    .agile-premium-shell .ring-blue-600,
    .agile-premium-shell .ring-indigo-500,
    .agile-premium-shell .ring-blue-500\/20 {
      --tw-ring-color: color-mix(in srgb, ${a.s500} 45%, transparent) !important;
    }
    .agile-premium-shell .shadow-blue-500\/25,
    .agile-premium-shell .shadow-blue-500\/30,
    .agile-premium-shell .shadow-blue-600\/30,
    .agile-premium-shell .shadow-cyan-500\/15,
    .agile-premium-shell .shadow-cyan-500\/20,
    .agile-premium-shell .shadow-cyan-500\/25 {
      --tw-shadow-color: color-mix(in srgb, ${a.s500} 35%, transparent) !important;
    }

    .model5-progress-fill { background: linear-gradient(90deg, ${a.s400}, ${a.s600}, ${a.s700}) !important; }
    .model5-hero {
      background:
        radial-gradient(circle at 85% 10%, color-mix(in srgb, ${a.s400} 26%, transparent), transparent 25%),
        radial-gradient(circle at 60% 5%, color-mix(in srgb, ${a.s200} 34%, transparent), transparent 32%),
        linear-gradient(135deg, color-mix(in srgb, ${a.s700} 84%, #020617), color-mix(in srgb, ${a.s600} 62%, #020617) 45%, rgba(15,23,42,.82)) !important;
    }
    .model5-shell {
      background:
        radial-gradient(circle at 78% 8%, color-mix(in srgb, ${a.s400} 18%, transparent), transparent 24%),
        radial-gradient(circle at 52% 12%, color-mix(in srgb, ${a.s200} 28%, transparent), transparent 28%),
        linear-gradient(135deg, color-mix(in srgb, ${a.s50} 82%, #ffffff) 0%, color-mix(in srgb, ${a.s100} 68%, #f8fbff) 42%, #f8fbff 100%) !important;
    }
    .dark .model5-shell {
      background:
        radial-gradient(circle at 76% 8%, color-mix(in srgb, ${a.s600} 16%, transparent), transparent 24%),
        radial-gradient(circle at 48% 14%, color-mix(in srgb, ${a.s400} 20%, transparent), transparent 28%),
        linear-gradient(135deg, #020617 0%, color-mix(in srgb, ${a.s800} 22%, #06172c) 45%, #0b1222 100%) !important;
    }
  `;

  const darkCSS = isDark
    ? `
    html.dark { color-scheme: dark; background-color: #020617 !important; }
    html.dark body, html.dark #root {
      background-color: #020617 !important;
      color: #f8fafc !important;
      min-height: 100%;
    }
    html.dark [class~="bg-[#F8FAFC]"],
    html.dark main,
    html.dark .min-h-screen {
      background-color: #020617 !important;
    }
    html.dark .bg-white { background-color: #0f172a !important; }
    html.dark [class~="bg-white/70"] { background-color: rgba(15, 23, 42, 0.78) !important; }
    html.dark .bg-slate-50,
    html.dark [class~="bg-slate-50/50"] { background-color: #111827 !important; }
    html.dark .bg-slate-100,
    html.dark [class~="bg-slate-100/50"],
    html.dark [class~="bg-slate-100/80"] { background-color: #1e293b !important; }
    html.dark .bg-slate-200,
    html.dark [class~="bg-slate-200/50"] { background-color: #334155 !important; }
    html.dark .bg-slate-800 { background-color: #1e293b !important; }
    html.dark .bg-slate-900 { background-color: #0f172a !important; }
    html.dark [class~="bg-slate-900/80"] { background-color: rgba(15, 23, 42, 0.88) !important; }
    html.dark .bg-blue-50, html.dark .bg-indigo-50 { background-color: rgba(37, 99, 235, 0.14) !important; }
    html.dark .bg-blue-100, html.dark .bg-indigo-100 { background-color: rgba(37, 99, 235, 0.22) !important; }
    html.dark .bg-emerald-50 { background-color: rgba(5, 150, 105, 0.16) !important; }
    html.dark .bg-emerald-100 { background-color: rgba(5, 150, 105, 0.24) !important; }
    html.dark .bg-amber-50 { background-color: rgba(217, 119, 6, 0.16) !important; }
    html.dark .bg-amber-100 { background-color: rgba(217, 119, 6, 0.24) !important; }
    html.dark .bg-red-50 { background-color: rgba(220, 38, 38, 0.14) !important; }
    html.dark .bg-red-100 { background-color: rgba(220, 38, 38, 0.24) !important; }
    html.dark .text-slate-900 { color: #f8fafc !important; }
    html.dark .text-slate-800 { color: #f1f5f9 !important; }
    html.dark .text-slate-700 { color: #e2e8f0 !important; }
    html.dark .text-slate-600 { color: #cbd5e1 !important; }
    html.dark .text-slate-500 { color: #94a3b8 !important; }
    html.dark .text-slate-400 { color: #cbd5e1 !important; }
    html.dark .text-slate-300 { color: #94a3b8 !important; }
    html.dark .text-emerald-700, html.dark .text-emerald-600 { color: #6ee7b7 !important; }
    html.dark .text-amber-700, html.dark .text-amber-600 { color: #fcd34d !important; }
    html.dark .text-red-800, html.dark .text-red-700, html.dark .text-red-600, html.dark .text-red-500, html.dark .text-red-400 { color: #fca5a5 !important; }
    html.dark .border-slate-200,
    html.dark [class~="border-slate-200/80"] { border-color: #334155 !important; }
    html.dark .border-slate-100 { border-color: #1e293b !important; }
    html.dark .border-slate-300 { border-color: #475569 !important; }
    html.dark .border-slate-600 { border-color: #475569 !important; }
    html.dark .border-slate-700,
    html.dark [class~="border-slate-700/80"] { border-color: #334155 !important; }
    html.dark .border-amber-100 { border-color: rgba(217, 119, 6, 0.35) !important; }
    html.dark .border-indigo-100 { border-color: rgba(79, 70, 229, 0.35) !important; }
    html.dark .border-r { border-color: #334155 !important; }
    html.dark .border-b { border-color: #334155 !important; }
    html.dark .border-t { border-color: #334155 !important; }
    html.dark .divide-slate-50 > * + *, html.dark .divide-slate-100 > * + * { border-color: #1e293b !important; }
    html.dark .divide-slate-200 > * + * { border-color: #334155 !important; }
    html.dark [class~="shadow-slate-200/50"], html.dark [class~="shadow-slate-200/60"], html.dark .shadow-blue-100, html.dark .shadow-blue-200 {
      --tw-shadow-color: rgba(0, 0, 0, 0.28) !important;
    }
    html.dark input, html.dark textarea, html.dark select {
      background-color: #111827 !important;
      border-color: #334155 !important;
      color: #f8fafc !important;
    }
    html.dark input::placeholder, html.dark textarea::placeholder { color: #94a3b8 !important; }
  `
    : "";

  // Only inject accent overrides when not default blue
  const accentCSS =
    accent !== "blue"
      ? `
    .bg-blue-50, .bg-indigo-50 { background-color: ${a.s50} !important; }
    .bg-blue-100, .bg-indigo-100 { background-color: ${a.s100} !important; }
    .bg-blue-200, .bg-indigo-200 { background-color: ${a.s200} !important; }
    .bg-blue-500, .bg-indigo-500 { background-color: ${a.s500} !important; }
    .bg-blue-600, .bg-indigo-600 { background-color: ${a.s600} !important; }
    .bg-blue-700, .bg-indigo-700 { background-color: ${a.s700} !important; }
    .text-blue-400, .text-indigo-400 { color: ${a.s400} !important; }
    .text-blue-500, .text-indigo-500 { color: ${a.s500} !important; }
    .text-blue-600, .text-indigo-600 { color: ${a.s600} !important; }
    .text-blue-700, .text-indigo-700 { color: ${a.s700} !important; }
    .border-blue-500, .border-indigo-500 { border-color: ${a.s500} !important; }
    .border-blue-600, .border-indigo-600 { border-color: ${a.s600} !important; }
    .hover\\:text-blue-600:hover, .hover\\:text-indigo-600:hover { color: ${a.s600} !important; }
    .hover\\:bg-blue-50:hover, .hover\\:bg-indigo-50:hover { background-color: ${a.s50} !important; }
    .hover\\:bg-blue-100:hover, .hover\\:bg-indigo-100:hover { background-color: ${a.s100} !important; }
    .hover\\:bg-blue-700:hover, .hover\\:bg-indigo-700:hover { background-color: ${a.s700} !important; }
    .focus\\:ring-blue-500:focus, .focus\\:ring-indigo-500:focus { --tw-ring-color: ${a.s500} !important; }
    .focus\\:border-blue-500:focus, .focus\\:border-indigo-500:focus { border-color: ${a.s500} !important; }
    .ring-blue-300, .ring-indigo-300 { --tw-ring-color: ${a.s200} !important; }
  `
      : "";

  return globalAccentCSS + accentCSS + darkCSS;
}

function getStyleEl(): HTMLStyleElement {
  let el = document.getElementById(
    "agile-appearance",
  ) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "agile-appearance";
    document.head.appendChild(el);
  }
  return el;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("@AgileTask:theme") || "light",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("@AgileTask:accent") || "blue",
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("@AgileTask:fontSize") || "medium",
  );

  const updateAppearance = (
    newTheme: string,
    newAccent: string,
    newSize: string,
  ) => {
    setTheme(newTheme);
    setAccentColor(newAccent);
    setFontSize(newSize);
    localStorage.setItem("@AgileTask:theme", newTheme);
    localStorage.setItem("@AgileTask:accent", newAccent);
    localStorage.setItem("@AgileTask:fontSize", newSize);
  };

  useEffect(() => {
    const root = document.documentElement;
    const fontSizes: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.setProperty("--font-size", fontSizes[fontSize] || "16px");
    root.style.fontSize = fontSizes[fontSize] || "16px";
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-agile-accent", accentColor);

    function apply(isDark: boolean) {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      getStyleEl().textContent = buildCSS(isDark, accentColor);
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      apply(theme === "dark");
    }
  }, [theme, accentColor]);

  return (
    <AppearanceContext.Provider
      value={{ theme, accentColor, fontSize, updateAppearance }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context)
    throw new Error("useAppearance must be used within AppearanceProvider");
  return context;
}

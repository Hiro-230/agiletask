import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type CustomColorPalette = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
};

interface AppearanceContextType {
  theme: string;
  accentColor: string;
  fontSize: string;
  customColors: CustomColorPalette;
  updateAppearance: (
    theme: string,
    accent: string,
    size: string,
    customColors?: CustomColorPalette,
  ) => void;
  resetCustomColors: () => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(
  undefined,
);

const DEFAULT_CUSTOM_COLORS: CustomColorPalette = {
  primary: "#7c3aed",
  secondary: "#06b6d4",
  background: "#020617",
  surface: "#0f172a",
};

const CUSTOM_COLORS_KEY = "@AgileTask:customColors";

type AccentPalette = {
  s50: string;
  s100: string;
  s200: string;
  s400: string;
  s500: string;
  s600: string;
  s700: string;
  s800: string;
};

// Full shade maps for each accent color
const ACCENT_MAP: Record<string, AccentPalette> = {
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

function normalizeHex(value: string | null | undefined, fallback: string) {
  const raw = (value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return fallback;
}

function hexToRgb(hex: string) {
  const clean = normalizeHex(hex, "#000000").slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(hexA: string, hexB: string, amountOfB: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = Math.max(0, Math.min(1, amountOfB));
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const conv = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * conv(r) + 0.7152 * conv(g) + 0.0722 * conv(b);
}

function textOn(hex: string) {
  return luminance(hex) > 0.48 ? "#0f172a" : "#ffffff";
}

function rgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function readCustomColors(): CustomColorPalette {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) || "{}");
    return {
      primary: normalizeHex(parsed.primary, DEFAULT_CUSTOM_COLORS.primary),
      secondary: normalizeHex(parsed.secondary, DEFAULT_CUSTOM_COLORS.secondary),
      background: normalizeHex(parsed.background, DEFAULT_CUSTOM_COLORS.background),
      surface: normalizeHex(parsed.surface, DEFAULT_CUSTOM_COLORS.surface),
    };
  } catch {
    return DEFAULT_CUSTOM_COLORS;
  }
}

function saveCustomColors(customColors: CustomColorPalette) {
  const clean: CustomColorPalette = {
    primary: normalizeHex(customColors.primary, DEFAULT_CUSTOM_COLORS.primary),
    secondary: normalizeHex(customColors.secondary, DEFAULT_CUSTOM_COLORS.secondary),
    background: normalizeHex(customColors.background, DEFAULT_CUSTOM_COLORS.background),
    surface: normalizeHex(customColors.surface, DEFAULT_CUSTOM_COLORS.surface),
  };
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(clean));
  return clean;
}

function paletteFromPrimary(primary: string): AccentPalette {
  const p = normalizeHex(primary, DEFAULT_CUSTOM_COLORS.primary);
  return {
    s50: mix(p, "#ffffff", 0.92),
    s100: mix(p, "#ffffff", 0.82),
    s200: mix(p, "#ffffff", 0.65),
    s400: mix(p, "#ffffff", 0.22),
    s500: mix(p, "#ffffff", 0.1),
    s600: p,
    s700: mix(p, "#000000", 0.18),
    s800: mix(p, "#000000", 0.34),
  };
}

function buildCSS(isDark: boolean, accent: string): string {
  const custom = readCustomColors();
  const isCustom = accent === "custom";
  const a = isCustom ? paletteFromPrimary(custom.primary) : ACCENT_MAP[accent] || ACCENT_MAP.blue;
  const primary = isCustom ? custom.primary : a.s600;
  const secondary = isCustom ? custom.secondary : a.s400;
  const bg = isCustom ? custom.background : "#020617";
  const surface = isCustom ? custom.surface : "#0f172a";
  const primaryRgb = rgbString(primary);
  const onPrimary = textOn(primary);
  const onSecondary = textOn(secondary);
  const onSurface = textOn(surface);
  const onBg = textOn(bg);
  const lightBackground = isCustom ? mix(custom.background, "#ffffff", 0.92) : "#f8fbff";
  const lightSurface = isCustom ? mix(custom.surface, "#ffffff", 0.88) : "#ffffff";
  const lightText = textOn(lightSurface);

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
      --agile-accent-rgb: ${primaryRgb};
      --agile-primary: ${primary};
      --agile-secondary: ${secondary};
      --agile-app-bg: ${isDark ? bg : lightBackground};
      --agile-surface: ${isDark ? surface : lightSurface};
      --agile-text-main: ${isDark ? onBg : lightText};
      --agile-text-muted: ${isDark ? mix(onBg, bg, 0.34) : mix(lightText, lightSurface, 0.42)};
      --agile-on-primary: ${onPrimary};
      --agile-on-secondary: ${onSecondary};
      --agile-on-surface: ${isDark ? onSurface : lightText};
    }

    /* Safe custom-color layer: only colors change; layout remains untouched. */
    .model5-shell {
      background:
        radial-gradient(circle at 78% 8%, color-mix(in srgb, var(--agile-secondary) 18%, transparent), transparent 24%),
        radial-gradient(circle at 52% 12%, color-mix(in srgb, var(--agile-primary) 16%, transparent), transparent 28%),
        linear-gradient(135deg, var(--agile-app-bg), color-mix(in srgb, var(--agile-app-bg) 72%, var(--agile-surface))) !important;
      color: var(--agile-text-main) !important;
    }

    .model5-hero {
      background:
        radial-gradient(circle at 85% 10%, color-mix(in srgb, var(--agile-secondary) 26%, transparent), transparent 25%),
        radial-gradient(circle at 60% 5%, color-mix(in srgb, var(--agile-primary) 38%, transparent), transparent 32%),
        linear-gradient(135deg, color-mix(in srgb, var(--agile-primary) 86%, #020617), color-mix(in srgb, var(--agile-secondary) 64%, #020617) 45%, rgba(15, 23, 42, .86)) !important;
      color: #ffffff !important;
    }

    .model5-hero h1, .model5-hero h2, .model5-hero h3, .model5-hero p, .model5-hero span,
    .dark .model5-hero h1, .dark .model5-hero h2, .dark .model5-hero h3, .dark .model5-hero p, .dark .model5-hero span {
      color: #ffffff !important;
    }

    .model5-progress-fill { background: linear-gradient(90deg, var(--agile-secondary), var(--agile-primary), ${a.s700}) !important; }

    .agile-premium-shell .from-cyan-300,
    .agile-premium-shell .from-cyan-400,
    .agile-premium-shell .from-cyan-500,
    .agile-premium-shell .from-sky-300,
    .agile-premium-shell .from-sky-400,
    .agile-premium-shell .from-blue-500,
    .agile-premium-shell .from-violet-400,
    .agile-premium-shell .from-emerald-300,
    .agile-premium-shell .from-amber-300 {
      --tw-gradient-from: var(--agile-secondary) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .agile-premium-shell .via-blue-500,
    .agile-premium-shell .via-blue-600,
    .agile-premium-shell .via-sky-400\/10 {
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--agile-primary) var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
    }
    .agile-premium-shell .to-blue-500,
    .agile-premium-shell .to-indigo-600,
    .agile-premium-shell .to-violet-500,
    .agile-premium-shell .to-violet-600,
    .agile-premium-shell .to-fuchsia-400,
    .agile-premium-shell .to-fuchsia-500,
    .agile-premium-shell .to-cyan-400 {
      --tw-gradient-to: var(--agile-primary) var(--tw-gradient-to-position) !important;
    }

    .agile-premium-shell .bg-cyan-300,
    .agile-premium-shell .bg-cyan-400,
    .agile-premium-shell .bg-blue-500,
    .agile-premium-shell .bg-blue-600,
    .agile-premium-shell .bg-indigo-500,
    .agile-premium-shell .bg-indigo-600,
    .agile-premium-shell .bg-violet-500,
    .agile-premium-shell .bg-violet-600 {
      background-color: var(--agile-primary) !important;
      color: var(--agile-on-primary) !important;
    }
    .agile-premium-shell .bg-blue-50,
    .agile-premium-shell .bg-indigo-50,
    .agile-premium-shell .bg-cyan-400\/10,
    .agile-premium-shell .bg-cyan-400\/12,
    .agile-premium-shell .bg-cyan-400\/15,
    .agile-premium-shell .bg-cyan-300\/18,
    .agile-premium-shell .bg-cyan-300\/20,
    .agile-premium-shell .bg-blue-50\/40 {
      background-color: color-mix(in srgb, var(--agile-primary) 14%, transparent) !important;
    }
    .agile-premium-shell .bg-blue-100,
    .agile-premium-shell .bg-indigo-100,
    .agile-premium-shell .bg-blue-200,
    .agile-premium-shell .bg-indigo-200 {
      background-color: color-mix(in srgb, var(--agile-primary) 24%, white) !important;
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
      color: var(--agile-secondary) !important;
    }
    .agile-premium-shell .border-cyan-300\/20,
    .agile-premium-shell .border-blue-300,
    .agile-premium-shell .border-blue-500,
    .agile-premium-shell .border-blue-600,
    .agile-premium-shell .border-indigo-500,
    .agile-premium-shell .border-indigo-600,
    .agile-premium-shell .border-indigo-700 {
      border-color: color-mix(in srgb, var(--agile-primary) 55%, transparent) !important;
    }
    .agile-premium-shell .ring-blue-500,
    .agile-premium-shell .ring-blue-600,
    .agile-premium-shell .ring-indigo-500,
    .agile-premium-shell .ring-blue-500\/20 {
      --tw-ring-color: color-mix(in srgb, var(--agile-primary) 45%, transparent) !important;
    }
    .agile-premium-shell .shadow-blue-500\/25,
    .agile-premium-shell .shadow-blue-500\/30,
    .agile-premium-shell .shadow-blue-600\/30,
    .agile-premium-shell .shadow-cyan-500\/15,
    .agile-premium-shell .shadow-cyan-500\/20,
    .agile-premium-shell .shadow-cyan-500\/25 {
      --tw-shadow-color: color-mix(in srgb, var(--agile-primary) 35%, transparent) !important;
    }

    .agile-premium-shell button[class*="bg-gradient"],
    .agile-premium-shell a[class*="bg-gradient"],
    .agile-premium-shell .bg-gradient-to-r,
    .agile-premium-shell .bg-gradient-to-br {
      color: #ffffff;
    }
  `;

  const darkCSS = isDark
    ? `
    html.dark { color-scheme: dark; background-color: var(--agile-app-bg) !important; }
    html.dark body, html.dark #root {
      background-color: var(--agile-app-bg) !important;
      color: var(--agile-text-main) !important;
      min-height: 100%;
    }
    html.dark [class~="bg-[#F8FAFC]"],
    html.dark main,
    html.dark .min-h-screen {
      background-color: var(--agile-app-bg) !important;
    }
    html.dark .bg-white { background-color: var(--agile-surface) !important; }
    html.dark [class~="bg-white/70"] { background-color: color-mix(in srgb, var(--agile-surface) 82%, transparent) !important; }
    html.dark .bg-slate-50,
    html.dark [class~="bg-slate-50/50"] { background-color: color-mix(in srgb, var(--agile-surface) 92%, #020617) !important; }
    html.dark .bg-slate-100,
    html.dark [class~="bg-slate-100/50"],
    html.dark [class~="bg-slate-100/80"] { background-color: color-mix(in srgb, var(--agile-surface) 88%, #1e293b) !important; }
    html.dark .bg-slate-200,
    html.dark [class~="bg-slate-200/50"] { background-color: color-mix(in srgb, var(--agile-surface) 70%, #475569) !important; }
    html.dark .bg-slate-800 { background-color: color-mix(in srgb, var(--agile-surface) 82%, #1e293b) !important; }
    html.dark .bg-slate-900 { background-color: var(--agile-surface) !important; }
    html.dark [class~="bg-slate-900/80"] { background-color: color-mix(in srgb, var(--agile-surface) 88%, transparent) !important; }
    html.dark .bg-blue-50, html.dark .bg-indigo-50 { background-color: color-mix(in srgb, var(--agile-primary) 14%, transparent) !important; }
    html.dark .bg-blue-100, html.dark .bg-indigo-100 { background-color: color-mix(in srgb, var(--agile-primary) 22%, transparent) !important; }
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
    html.dark [class~="border-slate-200/80"] { border-color: color-mix(in srgb, var(--agile-primary) 22%, #334155) !important; }
    html.dark .border-slate-100 { border-color: color-mix(in srgb, var(--agile-primary) 16%, #1e293b) !important; }
    html.dark .border-slate-300 { border-color: color-mix(in srgb, var(--agile-primary) 28%, #475569) !important; }
    html.dark .border-slate-600 { border-color: #475569 !important; }
    html.dark .border-slate-700,
    html.dark [class~="border-slate-700/80"] { border-color: #334155 !important; }
    html.dark .border-amber-100 { border-color: rgba(217, 119, 6, 0.35) !important; }
    html.dark .border-indigo-100 { border-color: color-mix(in srgb, var(--agile-primary) 35%, transparent) !important; }
    html.dark .border-r { border-color: #334155 !important; }
    html.dark .border-b { border-color: #334155 !important; }
    html.dark .border-t { border-color: #334155 !important; }
    html.dark .divide-slate-50 > * + *, html.dark .divide-slate-100 > * + * { border-color: #1e293b !important; }
    html.dark .divide-slate-200 > * + * { border-color: #334155 !important; }
    html.dark [class~="shadow-slate-200/50"], html.dark [class~="shadow-slate-200/60"], html.dark .shadow-blue-100, html.dark .shadow-blue-200 {
      --tw-shadow-color: rgba(0, 0, 0, 0.28) !important;
    }
    html.dark input, html.dark textarea, html.dark select {
      background-color: color-mix(in srgb, var(--agile-surface) 92%, #020617) !important;
      border-color: color-mix(in srgb, var(--agile-primary) 24%, #334155) !important;
      color: #f8fafc !important;
    }
    html.dark input::placeholder, html.dark textarea::placeholder { color: #94a3b8 !important; }
  `
    : `
    html:not(.dark) { color-scheme: light; }
    html:not(.dark) input, html:not(.dark) textarea, html:not(.dark) select {
      background-color: rgba(255,255,255,.82) !important;
      color: #0f172a !important;
      border-color: color-mix(in srgb, var(--agile-primary) 18%, #cbd5e1) !important;
    }
    html:not(.dark) input::placeholder, html:not(.dark) textarea::placeholder { color: #64748b !important; }
  `;

  const accentCSS =
    accent !== "blue"
      ? `
    .bg-blue-50, .bg-indigo-50 { background-color: ${a.s50} !important; }
    .bg-blue-100, .bg-indigo-100 { background-color: ${a.s100} !important; }
    .bg-blue-200, .bg-indigo-200 { background-color: ${a.s200} !important; }
    .bg-blue-500, .bg-indigo-500 { background-color: ${a.s500} !important; color: ${textOn(a.s500)} !important; }
    .bg-blue-600, .bg-indigo-600 { background-color: ${a.s600} !important; color: ${textOn(a.s600)} !important; }
    .bg-blue-700, .bg-indigo-700 { background-color: ${a.s700} !important; color: ${textOn(a.s700)} !important; }
    .text-blue-400, .text-indigo-400 { color: ${a.s400} !important; }
    .text-blue-500, .text-indigo-500 { color: ${a.s500} !important; }
    .text-blue-600, .text-indigo-600 { color: ${a.s600} !important; }
    .text-blue-700, .text-indigo-700 { color: ${a.s700} !important; }
    .border-blue-500, .border-indigo-500 { border-color: ${a.s500} !important; }
    .border-blue-600, .border-indigo-600 { border-color: ${a.s600} !important; }
    .hover\:text-blue-600:hover, .hover\:text-indigo-600:hover { color: ${a.s600} !important; }
    .hover\:bg-blue-50:hover, .hover\:bg-indigo-50:hover { background-color: ${a.s50} !important; }
    .hover\:bg-blue-100:hover, .hover\:bg-indigo-100:hover { background-color: ${a.s100} !important; }
    .hover\:bg-blue-700:hover, .hover\:bg-indigo-700:hover { background-color: ${a.s700} !important; }
    .focus\:ring-blue-500:focus, .focus\:ring-indigo-500:focus { --tw-ring-color: ${a.s500} !important; }
    .focus\:border-blue-500:focus, .focus\:border-indigo-500:focus { border-color: ${a.s500} !important; }
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
  const [customColors, setCustomColors] = useState<CustomColorPalette>(() => readCustomColors());

  const updateAppearance = (
    newTheme: string,
    newAccent: string,
    newSize: string,
    newCustomColors?: CustomColorPalette,
  ) => {
    const cleanedCustomColors = newCustomColors ? saveCustomColors(newCustomColors) : readCustomColors();
    setTheme(newTheme);
    setAccentColor(newAccent);
    setFontSize(newSize);
    setCustomColors(cleanedCustomColors);
    localStorage.setItem("@AgileTask:theme", newTheme);
    localStorage.setItem("@AgileTask:accent", newAccent);
    localStorage.setItem("@AgileTask:fontSize", newSize);
  };

  const resetCustomColors = () => {
    const clean = saveCustomColors(DEFAULT_CUSTOM_COLORS);
    setCustomColors(clean);
    setAccentColor("blue");
    localStorage.setItem("@AgileTask:accent", "blue");
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
  }, [theme, accentColor, customColors]);

  return (
    <AppearanceContext.Provider
      value={{ theme, accentColor, fontSize, customColors, updateAppearance, resetCustomColors }}
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

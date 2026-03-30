export const TOKENS = {
  canvas: "#19191C",
  shell: "#1D1D21",
  shellRaised: "#252529",
  panel: "#2D2D31",
  panelAlt: "#232327",
  panelInset: "#141416",
  border: "#2D2D31",
  borderStrong: "#414146",
  text: "#EDEDF0",
  textMuted: "#C3C3C6",
  textSubtle: "#818186",
  textWeak: "#6C6C71",
  accent: "#FD366E",
  accentStrong: "#CA2B58",
  accentMuted: "#4C1C2A",
  accentOverlay: "#3A1623",
  blue: "#68A3FE",
  success: "#10B981",
  successMuted: "#16362E",
  warning: "#FE7C43",
  warningMuted: "#3B2317",
  danger: "#FF453A",
  dangerMuted: "#3E1E1C",
  overlay: "#0A0A0D",
  chrome: "#0F0F12",
  rowHover: "#252529",
  rowActive: "#30242A",
  input: "#141416",
  badge: "#27272C",
} as const;

export const SIDEBAR_ICONS: Record<string, string> = {
  overview: "📊",
  auth: "👥",
  databases: "🗄️",
  functions: "⚡",
  messaging: "💬",
  storage: "📁",
  sites: "🌐",
  settings: "⚙️",
};

export const SIDEBAR_GROUPS = [
  {
    label: "Build",
    items: [
      { id: "auth", label: "Auth", active: true },
      { id: "databases", label: "Databases", active: true },
      { id: "functions", label: "Functions", active: false },
      { id: "messaging", label: "Messaging", active: false },
      { id: "storage", label: "Storage", active: false },
    ],
  },
  {
    label: "Deploy",
    items: [{ id: "sites", label: "Sites", active: false }],
  },
  {
    label: "Settings",
    items: [{ id: "settings", label: "Project settings", active: false }],
  },
] as const;

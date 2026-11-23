export type Settings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: "https://api.venice.ai/api/v1",
  apiKey: "",
  model: "venice-uncensored",
  temperature: 0.7,
  maxTokens: 4096,
};

const S_KEY = "axiom.settings.v1";
const H_KEY = "axiom.history.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(S_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(S_KEY, JSON.stringify(s));
  } catch {}
}

export type Attachment = { name: string; kind: "image" | "text"; data: string };

export type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: Attachment[];
};

export function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(H_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(m: Msg[]) {
  try {
    localStorage.setItem(H_KEY, JSON.stringify(m.slice(-200)));
  } catch {}
}

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

"use client";

export type BrainId = "gemini" | "mistral" | "groq" | "openrouter" | "huggingface";

export interface BrainConfig {
  id: BrainId;
  name: string;
  short: string;
  meta: string;
  accent: string;
  keyStorage: string;
  docsUrl: string;
  freeNote: string;
  placeholder: string;
  models: Array<{ id: string; name: string; badge: string }>;
}

export const AUTO_MODEL_OPTION = {
  id: "auto",
  name: "Auto — সেরা উপলব্ধ মডেল",
  badge: "লাইভ ডিসকভারি (রেকমেন্ডেড)",
};

export const BRAINS: BrainConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    short: "Gemini",
    meta: "3.8 Flash · Vision",
    accent: "#C6F24E",
    keyStorage: "virallens_gemini_key",
    docsUrl: "https://aistudio.google.com/app/apikey",
    freeNote: "AI Studio-তে ফ্রি টিয়ার",
    placeholder: "AIzaSy...",
    models: [
      AUTO_MODEL_OPTION,
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", badge: "Latest" },
      { id: "gemini-3-flash", name: "Gemini 3 Flash", badge: "3.x Vision" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Legacy" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    short: "Mistral",
    meta: "Pixtral · Vision",
    accent: "#FF7A5B",
    keyStorage: "virallens_mistral_key",
    docsUrl: "https://console.mistral.ai/api-keys/",
    freeNote: "ফ্রি টিয়ার আছে",
    placeholder: "mis_...",
    models: [
      AUTO_MODEL_OPTION,
      { id: "pixtral-large-latest", name: "Pixtral Large", badge: "Flagship" },
      { id: "pixtral-12b-2409", name: "Pixtral 12B", badge: "Open vision" },
      { id: "mistral-small-latest", name: "Mistral Small", badge: "Fast" },
    ],
  },
  {
    id: "groq",
    name: "Groq Cloud",
    short: "Groq",
    meta: "Llama 4 · Ultra fast",
    accent: "#F97316",
    keyStorage: "virallens_groq_key",
    docsUrl: "https://console.groq.com/keys",
    freeNote: "ফ্রি টিয়ার (ভিশন টিয়ার-ভেদে সীমিত)",
    placeholder: "gsk_...",
    models: [
      AUTO_MODEL_OPTION,
      { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick", badge: "Best vision" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", badge: "Fast vision" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    short: "OpenRouter",
    meta: "Free vision models",
    accent: "#5BC0F2",
    keyStorage: "virallens_openrouter_key",
    docsUrl: "https://openrouter.ai/keys",
    freeNote: "ফ্রি :free ভিশন মডেল — কার্ড লাগে না",
    placeholder: "sk-or-v1-...",
    models: [
      AUTO_MODEL_OPTION,
      { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B", badge: "Free · Vision" },
      { id: "qwen/qwen3.8-27b:free", name: "Qwen3.8 27B", badge: "Free · Vision" },
      { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 26B", badge: "Free · Vision" },
      { id: "nvidia/nemotron-3.5-super-vl:free", name: "Nemotron 3.5 VL", badge: "Free · Vision" },
    ],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    short: "HF",
    meta: "Router · Qwen VL",
    accent: "#EAB308",
    keyStorage: "virallens_hf_key",
    docsUrl: "https://huggingface.co/settings/tokens",
    freeNote: "মাসিক ফ্রি ক্রেডিট",
    placeholder: "hf_...",
    models: [
      AUTO_MODEL_OPTION,
      { id: "Qwen/Qwen2.5-VL-72B-Instruct", name: "Qwen2.5 VL 72B", badge: "Vision" },
      { id: "meta-llama/Llama-4-Scout-17B-16E-Instruct", name: "Llama 4 Scout", badge: "Vision" },
    ],
  },
];

export const brainById = (id: BrainId): BrainConfig =>
  BRAINS.find((brain) => brain.id === id) || BRAINS[0];

export type BrainKeys = Record<BrainId, string>;

export const emptyKeys = (): BrainKeys => ({
  gemini: "",
  mistral: "",
  groq: "",
  openrouter: "",
  huggingface: "",
});

export const loadKeys = (): BrainKeys => {
  const keys = emptyKeys();
  if (typeof window === "undefined") return keys;
  for (const brain of BRAINS) {
    try {
      keys[brain.id] = localStorage.getItem(brain.keyStorage) || "";
    } catch {
      // ignore
    }
  }
  return keys;
};

export const saveKeys = (keys: BrainKeys) => {
  if (typeof window === "undefined") return;
  for (const brain of BRAINS) {
    try {
      localStorage.setItem(brain.keyStorage, keys[brain.id] || "");
    } catch {
      // ignore
    }
  }
};

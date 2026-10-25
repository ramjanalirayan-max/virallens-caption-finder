/**
 * Live model registry.
 *
 * Providers retire and rename models constantly (e.g. Gemini 2.5 Flash being
 * closed to new users in favour of 3.x). Hardcoding a single model always
 * breaks eventually, so we ask the provider which vision models the key can
 * actually use, rank them by quality, and cache the answer briefly.
 */

export type BrainId = "gemini" | "mistral" | "groq" | "openrouter" | "huggingface";

export interface OpenAICompatibleProvider {
  id: Extract<BrainId, "groq" | "openrouter" | "huggingface">;
  label: string;
  chatUrl: string;
  modelsUrl: string;
  envKeys: string[];
  docsUrl: string;
  freeTier: string;
  defaults: string[];
  extraHeaders?: Record<string, string>;
}

export const OPENAI_COMPATIBLE_PROVIDERS: Record<
  "groq" | "openrouter" | "huggingface",
  OpenAICompatibleProvider
> = {
  groq: {
    id: "groq",
    label: "Groq Cloud",
    chatUrl: "https://api.groq.com/openai/v1/chat/completions",
    modelsUrl: "https://api.groq.com/openai/v1/models",
    envKeys: ["GROQ_API_KEY"],
    docsUrl: "https://console.groq.com/keys",
    freeTier: "ফ্রি টিয়ার আছে (ভিশন মডেল টিয়ার-ভেদে সীমিত)",
    defaults: [
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Free Models)",
    chatUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelsUrl: "https://openrouter.ai/api/v1/models",
    envKeys: ["OPENROUTER_API_KEY"],
    docsUrl: "https://openrouter.ai/keys",
    freeTier: "ফ্রি :free ভিশন মডেল — কার্ড ছাড়াই",
    defaults: [
      "google/gemma-4-31b-it:free",
      "qwen/qwen3.8-27b:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3.5-super-vl:free",
      "qwen/qwen2.5-vl-72b-instruct:free",
    ],
    extraHeaders: {
      "HTTP-Referer": "https://virallens.ai",
      "X-Title": "ViralLens AI",
    },
  },
  huggingface: {
    id: "huggingface",
    label: "Hugging Face Router",
    chatUrl: "https://router.huggingface.co/v1/chat/completions",
    modelsUrl: "https://router.huggingface.co/v1/models",
    envKeys: ["HUGGINGFACE_API_KEY", "HF_TOKEN"],
    docsUrl: "https://huggingface.co/settings/tokens",
    freeTier: "মাসিক ফ্রি ক্রেডিট (Inference Providers)",
    defaults: [
      "Qwen/Qwen2.5-VL-72B-Instruct",
      "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      "Qwen/Qwen2.5-VL-7B-Instruct",
    ],
  },
};

const VISION_HINTS = /vl|vision|llava|scout|maverick|gemma-4|gemma-3|qwen3\.8|omni|multimodal|llama-4/i;

export interface ModelDiscovery {
  models: string[];
  source: "discovered" | "defaults";
  error?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expires: number; value: ModelDiscovery }>();

/** Last-resort chain, ordered best → acceptable. Kept short and current. */
export const GEMINI_DEFAULT_CHAIN = [
  "gemini-3.8-flash",
  "gemini-3-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

export const MISTRAL_DEFAULT_CHAIN = [
  "pixtral-large-latest",
  "pixtral-12b-2409",
  "mistral-small-latest",
];

const NON_GENERATIVE = [
  "embedding",
  "embed",
  "aqa",
  "imagen",
  "veo",
  "tts",
  "learnlm",
  "gemma",
  "image-generation",
  "native-audio",
  "live",
  "guard",
  "rerank",
];

const TIER_WEIGHT: Record<string, number> = {
  pro: 1,
  flash: 0,
  "flash-lite": 2,
  ultra: 0,
  small: 3,
  large: 0,
};

function parseVersion(model: string): { major: number; minor: number; tier: string; unstable: boolean } {
  const match = model.match(/^gemini-(\d+)(?:\.(\d+))?-([a-z0-9.-]+)/i);
  const major = match ? parseInt(match[1], 10) : 0;
  const minor = match && match[2] ? parseInt(match[2], 10) : 0;
  const tier = match ? match[3] : model;
  const unstable = /preview|exp|experimental|latest/i.test(model);
  return { major, minor, tier, unstable };
}

/** Higher score = better quality/cost balance for viral copywriting. */
function geminiScore(model: string): number {
  const { major, minor, tier, unstable } = parseVersion(model);
  const tierKey = Object.keys(TIER_WEIGHT).find((key) => tier.startsWith(key));
  const tierScore = tierKey ? TIER_WEIGHT[tierKey] : 4;
  return major * 1000 + minor * 100 + (4 - tierScore) * 10 - (unstable ? 5 : 0);
}

export function rankGeminiModels(models: string[]): string[] {
  return [...new Set(models)]
    .filter((name) => /^gemini/i.test(name))
    .filter((name) => !NON_GENERATIVE.some((bad) => name.toLowerCase().includes(bad)))
    .sort((a, b) => geminiScore(b) - geminiScore(a));
}

function rankMistralModels(models: Array<{ id: string; vision?: boolean }>): string[] {
  const vision = models.filter(
    (m) => m.vision || /pixtral|vision|large|small|medium/i.test(m.id)
  );
  const pool = vision.length > 0 ? vision : models;
  return [...new Set(pool.map((m) => m.id))]
    .filter((id) => !NON_GENERATIVE.some((bad) => id.toLowerCase().includes(bad)))
    .sort((a, b) => {
      const rank = (id: string) =>
        id.includes("pixtral-large")
          ? 0
          : id.includes("pixtral")
            ? 1
            : id.includes("small")
              ? 3
              : 2;
      return rank(a) - rank(b);
    });
}

function withTimeout(ms = 9000): AbortSignal {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return new AbortController().signal;
  }
}

/** Asks Gemini which models this key can call generateContent on. */
export async function discoverGeminiModels(apiKey?: string): Promise<ModelDiscovery> {
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!key) {
    return { models: GEMINI_DEFAULT_CHAIN, source: "defaults", error: "NO_KEY" };
  }

  const cacheKey = `gemini:${key.slice(-12)}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`,
      { cache: "no-store", signal: withTimeout() }
    );

    if (!res.ok) {
      const value: ModelDiscovery = {
        models: GEMINI_DEFAULT_CHAIN,
        source: "defaults",
        error: `list-models ${res.status}`,
      };
      cache.set(cacheKey, { expires: Date.now() + 60_000, value });
      return value;
    }

    const json = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };

    const usable = (json.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => (m.name || "").replace(/^models\//, ""))
      .filter(Boolean);

    const ranked = rankGeminiModels(usable);
    const value: ModelDiscovery = ranked.length
      ? { models: ranked.slice(0, 8), source: "discovered" }
      : { models: GEMINI_DEFAULT_CHAIN, source: "defaults", error: "EMPTY_LIST" };

    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (error) {
    const value: ModelDiscovery = {
      models: GEMINI_DEFAULT_CHAIN,
      source: "defaults",
      error: error instanceof Error ? error.message.slice(0, 120) : "discovery failed",
    };
    cache.set(cacheKey, { expires: Date.now() + 60_000, value });
    return value;
  }
}

/** Asks Mistral which models this key can use, preferring vision models. */
export async function discoverMistralModels(apiKey?: string): Promise<ModelDiscovery> {
  const key = apiKey?.trim() || process.env.MISTRAL_API_KEY;

  if (!key) {
    return { models: MISTRAL_DEFAULT_CHAIN, source: "defaults", error: "NO_KEY" };
  }

  const cacheKey = `mistral:${key.slice(-12)}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const res = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: withTimeout(),
    });

    if (!res.ok) {
      const value: ModelDiscovery = {
        models: MISTRAL_DEFAULT_CHAIN,
        source: "defaults",
        error: `list-models ${res.status}`,
      };
      cache.set(cacheKey, { expires: Date.now() + 60_000, value });
      return value;
    }

    const json = (await res.json()) as {
      data?: Array<{ id?: string; capabilities?: { vision?: boolean } }>;
    };

    const ranked = rankMistralModels(
      (json.data || [])
        .filter((m) => Boolean(m.id))
        .map((m) => ({ id: m.id as string, vision: Boolean(m.capabilities?.vision) }))
    );

    const value: ModelDiscovery = ranked.length
      ? { models: ranked.slice(0, 6), source: "discovered" }
      : { models: MISTRAL_DEFAULT_CHAIN, source: "defaults", error: "EMPTY_LIST" };

    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (error) {
    const value: ModelDiscovery = {
      models: MISTRAL_DEFAULT_CHAIN,
      source: "defaults",
      error: error instanceof Error ? error.message.slice(0, 120) : "discovery failed",
    };
    cache.set(cacheKey, { expires: Date.now() + 60_000, value });
    return value;
  }
}

/**
 * Builds the ordered model list to try for a request.
 * - "auto" / empty  → discovered models first, then defaults
 * - explicit model  → that model first, but only if the key can actually see
 *   it (retired models are demoted to the end so we don't waste a round-trip)
 */
export async function buildVisionModelChain(
  brain: BrainId,
  apiKey: string | undefined,
  requested?: string
): Promise<{ chain: string[]; requested: string; source: ModelDiscovery["source"] | "explicit"; discoveryError?: string }> {
  const discovery = await discoverModelsForBrain(brain, apiKey);

  const defaults =
    brain === "mistral"
      ? MISTRAL_DEFAULT_CHAIN
      : brain === "gemini"
        ? GEMINI_DEFAULT_CHAIN
        : OPENAI_COMPATIBLE_PROVIDERS[brain].defaults;
  const wanted = (requested || "auto").trim();
  const isAuto = !wanted || wanted === "auto";

  if (isAuto) {
    return {
      chain: [...new Set([...discovery.models, ...defaults])].slice(0, 8),
      requested: "auto",
      source: discovery.source,
      discoveryError: discovery.error,
    };
  }

  const available = discovery.models.includes(wanted);
  const legacy =
    brain === "gemini" && isLegacyGemini(wanted) && looksNewerThan(discovery.models[0], wanted);

  // A model can still be listed yet be closed to new users. If the user has an
  // older generation selected while a newer one is available, prefer the newer
  // one first so we don't waste a failing round-trip.
  const chain = available && !legacy
    ? [wanted, ...discovery.models, ...defaults]
    : [...discovery.models, ...defaults, wanted];

  return {
    chain: [...new Set(chain)].slice(0, 9),
    requested: wanted,
    source: available ? "explicit" : discovery.source,
    discoveryError: discovery.error,
  };
}

function majorOf(model?: string): number {
  if (!model) return 0;
  const match = model.match(/gemini-(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function isLegacyGemini(model: string): boolean {
  return majorOf(model) > 0 && majorOf(model) <= 2;
}

function looksNewerThan(candidate: string | undefined, requested: string): boolean {
  return majorOf(candidate) > majorOf(requested);
}

/** Asks an OpenAI-compatible provider which models the key can use. */
export async function discoverOpenAICompatible(
  brain: "groq" | "openrouter" | "huggingface",
  apiKey?: string
): Promise<ModelDiscovery> {
  const provider = OPENAI_COMPATIBLE_PROVIDERS[brain];
  const key =
    apiKey?.trim() ||
    provider.envKeys.map((name) => process.env[name]).find(Boolean);

  if (!key) {
    return { models: provider.defaults, source: "defaults", error: "NO_KEY" };
  }

  const cacheKey = `${brain}:${key.slice(-12)}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const res = await fetch(provider.modelsUrl, {
      headers: { Authorization: `Bearer ${key}`, ...(provider.extraHeaders || {}) },
      cache: "no-store",
      signal: withTimeout(),
    });

    if (!res.ok) {
      const value: ModelDiscovery = {
        models: provider.defaults,
        source: "defaults",
        error: `list-models ${res.status}`,
      };
      cache.set(cacheKey, { expires: Date.now() + 60_000, value });
      return value;
    }

    const json = (await res.json()) as {
      data?: Array<{
        id?: string;
        architecture?: { input_modalities?: string[] };
        pricing?: { prompt?: string; completion?: string };
      }>;
    };

    const all = json.data || [];
    const vision = all.filter((m) => {
      const modalities = m.architecture?.input_modalities || [];
      if (modalities.length > 0) return modalities.includes("image");
      return VISION_HINTS.test(m.id || "");
    });

    const pool = vision.length > 0 ? vision : all;
    const ranked = pool
      .map((m) => m.id as string)
      .filter(Boolean)
      .filter((id) => !NON_GENERATIVE.some((bad) => id.toLowerCase().includes(bad)))
      .sort((a, b) => {
        const freeA = a.endsWith(":free") ? 0 : 1;
        const freeB = b.endsWith(":free") ? 0 : 1;
        if (brain === "openrouter" && freeA !== freeB) return freeA - freeB;
        const hintA = VISION_HINTS.test(a) ? 0 : 1;
        const hintB = VISION_HINTS.test(b) ? 0 : 1;
        return hintA - hintB;
      });

    const value: ModelDiscovery = ranked.length
      ? { models: ranked.slice(0, 8), source: "discovered" }
      : { models: provider.defaults, source: "defaults", error: "NO_VISION_MODELS" };

    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (error) {
    const value: ModelDiscovery = {
      models: provider.defaults,
      source: "defaults",
      error: error instanceof Error ? error.message.slice(0, 120) : "discovery failed",
    };
    cache.set(cacheKey, { expires: Date.now() + 60_000, value });
    return value;
  }
}

export async function discoverModelsForBrain(
  brain: BrainId,
  apiKey?: string
): Promise<ModelDiscovery> {
  if (brain === "gemini") return discoverGeminiModels(apiKey);
  if (brain === "mistral") return discoverMistralModels(apiKey);
  return discoverOpenAICompatible(brain, apiKey);
}

/** Human explanation for provider errors about retired/unknown models. */
export function explainModelError(raw: string): { code: string; message: string } | null {
  if (/no longer available|not available to new users|deprecated|has been retired/i.test(raw)) {
    return {
      code: "MODEL_RETIRED",
      message: "এই মডেলটি নতুন ইউজারদের জন্য বন্ধ করা হয়েছে — স্বয়ংক্রিয়ভাবে নতুন মডেলে চেষ্টা করা হচ্ছে।",
    };
  }
  if (/not found|does not exist|not supported|404/i.test(raw)) {
    return {
      code: "MODEL_UNAVAILABLE",
      message: "এই মডেলটি পাওয়া যাচ্ছে না — স্বয়ংক্রিয়ভাবে বিকল্প মডেল চেষ্টা করা হচ্ছে।",
    };
  }
  return null;
}

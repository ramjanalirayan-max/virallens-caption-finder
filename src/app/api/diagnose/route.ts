import { NextRequest, NextResponse } from "next/server";
import {
  analyzeWithGemini,
  analyzeWithMistral,
  analyzeWithOpenAICompatible,
  DIAGNOSTIC_IMAGE_BASE64,
} from "@/lib/ai-brains";
import {
  discoverModelsForBrain,
  explainModelError,
  OPENAI_COMPATIBLE_PROVIDERS,
  type BrainId,
} from "@/lib/model-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface BrainReport {
  brain: BrainId;
  label: string;
  ok: boolean;
  latencyMs: number;
  model?: string;
  code?: string;
  error?: string;
  hint?: string;
  sections?: number;
}

/** Shortens raw provider payloads and attaches a helpful next action. */
function explain(raw: string): { error: string; code: string; hint: string } {
  const messageMatch =
    raw.match(/"message"\s*:\s*"([^"]{3,300})"/i) ||
    raw.match(/"detail"\s*:\s*"([^"]{3,300})"/i);
  const message = (messageMatch?.[1] || raw).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();

  if (/api key not valid|api_key_invalid|invalid api key/i.test(raw)) {
    return {
      error: "API key সঠিক নয়",
      code: "INVALID_KEY",
      hint: "AI Studio → Get API key থেকে নতুন key কপি করুন (স্পেস বা newline ছাড়া)।",
    };
  }
  if (/quota|rate limit|resource_exhausted|429/i.test(raw)) {
    return {
      error: "কোটা বা রেট লিমিট শেষ",
      code: "QUOTA",
      hint: "নতুন key নিন, অথবা Gemini 2.5 Flash Lite মডেল বেছে নিন।",
    };
  }
  if (/MAX_TOKENS|token budget/i.test(raw)) {
    return {
      error: "Token বাজেট শেষ (empty response)",
      code: "MAX_TOKENS",
      hint: "thinking বন্ধ করা হয়েছে; আবার ডায়াগনস্টিক চালান। সমস্যা থাকলে Lite মডেল ব্যবহার করুন।",
    };
  }
  if (/no text|কোনো টেক্সট/i.test(raw)) {
    return {
      error: "মডেল খালি রেসপন্স দিয়েছে",
      code: "EMPTY_RESPONSE",
      hint: "মডেলটি ভিশন সাপোর্ট করছে কি না দেখুন, অথবা ফ্ল্যাশ মডেল বেছে নিন।",
    };
  }
  const retired = explainModelError(raw);
  if (retired?.code === "MODEL_RETIRED") {
    return {
      error: "এই মডেলটি নতুন ইউজারদের জন্য বন্ধ",
      code: "MODEL_RETIRED",
      hint: "অ্যাপ এখন Auto মোডে সেরা উপলব্ধ মডেল নিজেই বেছে নেয় — আবার Analyze চালান।",
    };
  }
  if (/not found|404|not supported|does not exist/i.test(raw)) {
    return {
      error: "এই মডেলটি পাওয়া যাচ্ছে না",
      code: "MODEL_UNAVAILABLE",
      hint: "মডেল ড্রপডাউন থেকে Gemini 2.5 Flash বেছে নিন।",
    };
  }
  if (/permission|403|billing|disabled/i.test(raw)) {
    return {
      error: "এই key-তে অনুমতি নেই",
      code: "PERMISSION",
      hint: "Google Cloud প্রজেক্টে Generative Language API চালু আছে কি না দেখুন।",
    };
  }
  if (/blocked|blockReason|safety/i.test(raw)) {
    return {
      error: "সেফটি ফিল্টারে আটকে গেছে",
      code: "SAFETY",
      hint: "অন্য ছবি চেষ্টা করুন বা কনটেক্সট নোট দিন।",
    };
  }
  if (/fetch failed|ENOTFOUND|ECONN|network|timeout/i.test(raw)) {
    return {
      error: "নেটওয়ার্ক সমস্যা",
      code: "NETWORK",
      hint: "সার্ভারের ইন্টারনেট সংযোগ বা প্রক্সি চেক করুন।",
    };
  }
  if (/not configured|missing/i.test(raw)) {
    return {
      error: "কোনো API key পাওয়া যায়নি",
      code: "NO_KEY",
      hint: "Settings-এ key দিন অথবা সার্ভারের env-এ GEMINI_API_KEY সেট করুন।",
    };
  }

  return {
    error: message.slice(0, 200) || "অজানা ত্রুটি",
    code: "UNKNOWN",
    hint: "মডেল পরিবর্তন করে আবার চেষ্টা করুন।",
  };
}

async function testGemini(apiKey: string | undefined, model: string): Promise<BrainReport> {
  const started = Date.now();
  try {
    const result = await analyzeWithGemini({
      imageBase64: DIAGNOSTIC_IMAGE_BASE64,
      mimeType: "image/png",
      brain: "gemini",
      model,
      apiKey,
      language: "English",
      tone: "Viral",
      userNotes: "Connectivity diagnostic ping. Describe one subject only.",
    });
    return {
      brain: "gemini",
      label: "Google Gemini",
      ok: true,
      latencyMs: Date.now() - started,
      model,
      sections: Object.keys(result || {}).length,
    };
  } catch (error) {
    const detail = explain(error instanceof Error ? error.message : String(error));
    if (detail.code === "NO_KEY") {
      detail.hint = "Settings-এ Gemini key দিন, অথবা সার্ভারে GEMINI_API_KEY সেট করুন (AI Studio → Get API key)।";
    }
    return {
      brain: "gemini",
      label: "Google Gemini",
      ok: false,
      latencyMs: Date.now() - started,
      model,
      ...detail,
    };
  }
}

async function testMistral(apiKey: string | undefined, model: string): Promise<BrainReport> {
  const started = Date.now();
  try {
    const result = await analyzeWithMistral({
      imageBase64: DIAGNOSTIC_IMAGE_BASE64,
      mimeType: "image/png",
      brain: "mistral",
      model,
      apiKey,
      language: "English",
      tone: "Viral",
      userNotes: "Connectivity diagnostic ping. Describe one subject only.",
    });
    return {
      brain: "mistral",
      label: "Mistral AI",
      ok: true,
      latencyMs: Date.now() - started,
      model,
      sections: Object.keys(result || {}).length,
    };
  } catch (error) {
    const detail = explain(error instanceof Error ? error.message : String(error));
    if (detail.code === "NO_KEY") {
      detail.hint = "Settings-এ Mistral key দিন, অথবা সার্ভারে MISTRAL_API_KEY সেট করুন (console.mistral.ai)।";
    }
    return {
      brain: "mistral",
      label: "Mistral AI",
      ok: false,
      latencyMs: Date.now() - started,
      model,
      ...detail,
    };
  }
}

async function testOpenAICompatible(
  brain: "groq" | "openrouter" | "huggingface",
  apiKey: string | undefined,
  model: string
): Promise<BrainReport> {
  const started = Date.now();
  const provider = OPENAI_COMPATIBLE_PROVIDERS[brain];
  try {
    const result = await analyzeWithOpenAICompatible({
      imageBase64: DIAGNOSTIC_IMAGE_BASE64,
      mimeType: "image/png",
      brain,
      model,
      apiKey,
      language: "English",
      tone: "Viral",
      userNotes: "Connectivity diagnostic ping.",
    });
    return {
      brain,
      label: provider.label,
      ok: true,
      latencyMs: Date.now() - started,
      model,
      sections: Object.keys(result || {}).length,
    };
  } catch (error) {
    const detail = explain(error instanceof Error ? error.message : String(error));
    if (detail.code === "NO_KEY") {
      detail.hint = `Settings-এ ${provider.label} key দিন (${provider.docsUrl}) — ${provider.freeTier}।`;
    }
    return {
      brain,
      label: provider.label,
      ok: false,
      latencyMs: Date.now() - started,
      model,
      ...detail,
    };
  }
}

export async function POST(req: NextRequest) {
  let body: {
    brain?: BrainId | "both" | "all";
    geminiKey?: string;
    mistralKey?: string;
    groqKey?: string;
    openrouterKey?: string;
    huggingfaceKey?: string;
    geminiModel?: string;
    mistralModel?: string;
  } = {};

  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const target = body.brain || "both";
  const keys: Record<BrainId, string | undefined> = {
    gemini: body.geminiKey,
    mistral: body.mistralKey,
    groq: body.groqKey,
    openrouter: body.openrouterKey,
    huggingface: body.huggingfaceKey,
  };

  const allBrains: BrainId[] = ["gemini", "mistral", "groq", "openrouter", "huggingface"];
  const targets: BrainId[] =
    target === "all" || target === "both"
      ? allBrains
      : [target as BrainId];

  const discoveries = await Promise.all(
    targets.map((brain) => discoverModelsForBrain(brain, keys[brain]))
  );

  const jobs: Array<Promise<BrainReport>> = targets.map((brain, index) => {
    const model = discoveries[index].models[0] || "auto";
    if (brain === "gemini") return testGemini(keys.gemini, body.geminiModel || model);
    if (brain === "mistral") return testMistral(keys.mistral, body.mistralModel || model);
    return testOpenAICompatible(brain, keys[brain], model);
  });

  const reports = await Promise.all(jobs);
  const discovery = Object.fromEntries(
    targets.map((brain, index) => [
      brain,
      {
        models: discoveries[index].models,
        source: discoveries[index].source,
        error: discoveries[index].error ?? null,
      },
    ])
  );

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    env: {
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
    },
    reports,
    discovery,
    verdict:
      reports.every((r) => r.ok)
        ? "দুটি ব্রেনই সঠিকভাবে কাজ করছে ✅"
        : reports.some((r) => r.ok)
          ? "একটি ব্রেন কাজ করছে, অন্যটিতে সমস্যা আছে ⚠️"
          : "কোনো ব্রেনই উত্তর দিচ্ছে না ❌",
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "/api/diagnose",
    method: "POST",
    body: { brain: "gemini | mistral | both", geminiKey: "optional", mistralKey: "optional" },
  });
}

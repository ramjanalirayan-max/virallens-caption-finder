import { NextRequest, NextResponse } from "next/server";
import {
  rankGeminiModels,
  OPENAI_COMPATIBLE_PROVIDERS,
  discoverOpenAICompatible,
  type BrainId,
} from "@/lib/model-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ValidateBody {
  brain?: BrainId;
  apiKey?: string;
  model?: string;
}

function shortMessage(raw: string): string {
  const match =
    raw.match(/"message"\s*:\s*"([^"]{3,240})"/i) ||
    raw.match(/"detail"\s*:\s*"([^"]{3,240})"/i);
  const message = (match?.[1] || raw).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return message.slice(0, 240);
}

export async function POST(req: NextRequest) {
  let body: ValidateBody;
  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json(
      { success: false, valid: false, message: "রিকোয়েস্ট বডি সঠিক নয়।" },
      { status: 400 }
    );
  }

  const brains: BrainId[] = ["gemini", "mistral", "groq", "openrouter", "huggingface"];
  const brain: BrainId = brains.includes(body.brain as BrainId) ? (body.brain as BrainId) : "gemini";

  // OpenAI-compatible providers share one validation path.
  if (brain === "groq" || brain === "openrouter" || brain === "huggingface") {
    const provider = OPENAI_COMPATIBLE_PROVIDERS[brain];
    const discovery = await discoverOpenAICompatible(brain, body.apiKey);
    const key =
      body.apiKey?.trim() || provider.envKeys.map((name) => process.env[name]).find(Boolean);

    if (!key) {
      return NextResponse.json({
        success: true,
        valid: false,
        source: "none",
        message: `কোনো ${provider.label} key পাওয়া যায়নি। Settings-এ key দিন।`,
      });
    }

    const invalid = discovery.error?.startsWith("list-models");
    return NextResponse.json({
      success: true,
      valid: !invalid,
      source: body.apiKey?.trim() ? "custom" : "env",
      recommendedModel: discovery.models[0] || null,
      visionModels: discovery.models,
      message: invalid
        ? `key যাচাই করা যায়নি (${discovery.error})। key ঠিক আছে কি না দেখুন।`
        : `${provider.label} key সঠিক ✅ — সেরা ভিশন মডেল: ${discovery.models[0]}`,
    });
  }

  const key =
    body.apiKey?.trim() ||
    (brain === "mistral"
      ? process.env.MISTRAL_API_KEY
      : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (!key) {
    return NextResponse.json({
      success: true,
      valid: false,
      source: "none",
      message:
        brain === "mistral"
          ? "কোনো Mistral key পাওয়া যায়নি। Settings-এ key দিন।"
          : "কোনো Gemini key পাওয়া যায়নি। Settings-এ key দিন।",
    });
  }

  try {
    if (brain === "mistral") {
      const res = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      const text = await res.text();

      if (!res.ok) {
        return NextResponse.json({
          success: true,
          valid: false,
          status: res.status,
          message: shortMessage(text) || "Mistral key যাচাই করা যায়নি।",
        });
      }

      let visionModels: string[] = [];
      try {
        const data = JSON.parse(text) as { data?: Array<{ id?: string; capabilities?: { vision?: boolean } }> };
        visionModels = (data.data || [])
          .filter((m) => m.capabilities?.vision || /pixtral|vision/i.test(m.id || ""))
          .map((m) => m.id as string)
          .slice(0, 8);
      } catch {
        // ignore parse issues
      }

      return NextResponse.json({
        success: true,
        valid: true,
        source: body.apiKey?.trim() ? "custom" : "env",
        message: `Mistral key সঠিকভাবে কাজ করছে ✅${
          visionModels.length ? ` (Vision: ${visionModels.join(", ")})` : ""
        }`,
        visionModels,
      });
    }

    // Gemini: the lightest authenticated call is models.list
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { cache: "no-store" }
    );
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        valid: false,
        status: res.status,
        message: shortMessage(text) || "Gemini key যাচাই করা যায়নি।",
      });
    }

    let visionModels: string[] = [];
    try {
      const data = JSON.parse(text) as {
        models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
      };
      const usable = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => (m.name || "").replace("models/", ""));
      visionModels = rankGeminiModels(usable).slice(0, 6);
    } catch {
      // ignore parse issues
    }

    return NextResponse.json({
      success: true,
      valid: true,
      source: body.apiKey?.trim() ? "custom" : "env",
      message: `Gemini key সঠিকভাবে কাজ করছে ✅${
        visionModels.length ? ` (${visionModels.slice(0, 4).join(", ")}...)` : ""
      }`,
      visionModels,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      valid: false,
      message:
        error instanceof Error
          ? `যাচাই করা যায়নি: ${error.message.slice(0, 180)}`
          : "যাচাই করা যায়নি: network error",
    });
  }
}

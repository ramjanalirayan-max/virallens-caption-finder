import { NextRequest, NextResponse } from "next/server";
import { GEMINI_CHAIN, MISTRAL_CHAIN } from "@/lib/ai-brains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ValidateBody {
  brain?: "gemini" | "mistral";
  apiKey?: string;
  /** run a real vision request to prove the whole path works */
  probe?: boolean;
}

function shortMessage(raw: string): string {
  const m = raw.match(/"message"\s*:\s*"([^"]{3,240})"/i) || raw.match(/"detail"\s*:\s*"([^"]{3,240})"/i);
  return (m?.[1] || raw).replace(/\\n/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}

/** 1×1 transparent PNG — enough to prove vision works */
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function POST(req: NextRequest) {
  let body: ValidateBody;
  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json({ success: false, valid: false, message: "রিকোয়েস্ট বডি সঠিক নয়।" }, { status: 400 });
  }

  const brain: "gemini" | "mistral" = body.brain === "mistral" ? "mistral" : "gemini";
  const probe = body.probe !== false;

  const key =
    body.apiKey?.trim() ||
    (brain === "mistral" ? process.env.MISTRAL_API_KEY : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  const source = body.apiKey?.trim() ? "custom" : key ? "env" : "none";

  if (!key) {
    return NextResponse.json({
      success: true,
      valid: false,
      source: "none",
      message:
        brain === "mistral"
          ? "কোনো Mistral key পাওয়া যায়নি। Settings-এ key দিন।"
          : "কোনো Gemini key পাওয়া যায়নি। Settings-এ key দিন।",
    });
  }

  /* ---------------------------- MISTRAL ---------------------------- */
  if (brain === "mistral") {
    try {
      const res = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        return NextResponse.json({ success: true, valid: false, status: res.status, source, message: shortMessage(text) || "Mistral key যাচাই করা যায়নি।" });
      }

      let visionModels: string[] = [];
      try {
        const data = JSON.parse(text) as { data?: Array<{ id?: string; capabilities?: { vision?: boolean } }> };
        visionModels = (data.data || [])
          .filter((m) => m.capabilities?.vision || /pixtral/i.test(m.id || ""))
          .map((m) => String(m.id))
          .slice(0, 10);
      } catch {
        /* ignore */
      }

      const chainStatus = MISTRAL_CHAIN.map((m) => ({ model: m, available: visionModels.length === 0 ? true : visionModels.includes(m) }));

      return NextResponse.json({
        success: true,
        valid: true,
        source,
        message: `Mistral key কাজ করছে ✅ ${visionModels.length ? `vision models: ${visionModels.slice(0, 4).join(", ")}` : ""}`,
        visionModels,
        chainStatus,
      });
    } catch (error) {
      return NextResponse.json({ success: true, valid: false, source, message: error instanceof Error ? `network error: ${error.message.slice(0, 160)}` : "network error" });
    }
  }

  /* ----------------------------- GEMINI ---------------------------- */
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    const listText = await listRes.text();

    if (!listRes.ok) {
      const status = listRes.status;
      const raw = shortMessage(listText);
      const message =
        /api key not valid|api_key_invalid/i.test(listText)
          ? "Gemini API key সঠিক নয় — AI Studio থেকে নতুন key নিন।"
          : status === 429
            ? "Gemini কোটা শেষ (429)। কিছুক্ষণ পরে চেষ্টা করুন।"
            : status === 403
              ? "এই key-তে অনুমতি নেই (403)। Generative Language API চালু আছে কিনা দেখুন।"
              : raw || `Gemini key যাচাই করা যায়নি (HTTP ${status})।`;
      return NextResponse.json({ success: true, valid: false, status, source, message });
    }

    // which of our chain models can actually generateContent?
    let available: string[] = [];
    try {
      const data = JSON.parse(listText) as {
        models?: Array<{ name?: string; supportedGenerationMethods?: string[]; displayName?: string }>;
      };
      available = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => String(m.name || "").replace("models/", ""));
    } catch {
      /* ignore */
    }

    const chainStatus = GEMINI_CHAIN.map((m) => ({ model: m, available: available.length === 0 ? true : available.includes(m) }));
    const usable = chainStatus.filter((c) => c.available).map((c) => c.model);

    if (!probe) {
      return NextResponse.json({
        success: true,
        valid: true,
        source,
        message: `Gemini key কাজ করছে ✅ ${usable.length ? `available: ${usable.slice(0, 3).join(", ")}` : ""}`,
        visionModels: available.filter((m) => /gemini|imagen|learnlm/i.test(m)).slice(0, 20),
        chainStatus,
      });
    }

    // ---- live vision probe on the first available chain model ----
    const probeModel = usable[0] || GEMINI_CHAIN[0];
    const probeRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${probeModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/png", data: TINY_PNG } },
              { text: "Reply with ONLY this JSON: {\"ok\":true,\"seen\":\"describe the image in 6 words\"}" },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
          maxOutputTokens: 8192,
          ...( /2\.5|3/i.test(probeModel) ? { thinkingConfig: { thinkingBudget: 512 } } : {}),
        },
      }),
    });

    const probeText = await probeRes.text();
    if (!probeRes.ok) {
      return NextResponse.json({
        success: true,
        valid: true,
        source,
        probe: { model: probeModel, ok: false, status: probeRes.status, message: shortMessage(probeText) },
        chainStatus,
        message: `Key সঠিক, কিন্তু vision call ব্যর্থ (${probeModel}): ${shortMessage(probeText)}`,
      });
    }

    let probeJson: {
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    } = {};
    try {
      probeJson = JSON.parse(probeText);
    } catch {
      /* ignore */
    }

    const candidate = probeJson.candidates?.[0];
    const reply = (candidate?.content?.parts || []).map((p) => p.text || "").join("").trim();
    const finish = candidate?.finishReason;
    const usage = probeJson.usageMetadata;

    // The classic failure mode: thinking ate the whole budget → no text
    if (!reply) {
      return NextResponse.json({
        success: true,
        valid: true,
        source,
        probe: { model: probeModel, ok: false, finishReason: finish, usage },
        chainStatus,
        message:
          finish === "MAX_TOKENS"
            ? `Key সঠিক কিন্তু ${probeModel} সব টোকেন reasoning-এ খরচ করে ফেলেছে (finishReason: MAX_TOKENS)। অ্যাপে এটি ঠিক করা আছে — বড় output budget ব্যবহার হয়।`
            : `Key সঠিক কিন্তু ${probeModel} কোনো টেক্সট দেয়নি (finishReason: ${finish || "unknown"})।`,
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      source,
      probe: { model: probeModel, ok: true, finishReason: finish, reply: reply.slice(0, 200), usage },
      message: `Gemini vision সম্পূর্ণ কাজ করছে ✅ (${probeModel}${usage?.thoughtsTokenCount ? `, thinking ${usage.thoughtsTokenCount} tok` : ""})`,
      visionModels: available.filter((m) => /gemini/i.test(m)).slice(0, 20),
      chainStatus,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      valid: false,
      source,
      message: error instanceof Error ? `যাচাই করা যায়নি: ${error.message.slice(0, 180)}` : "যাচাই করা যায়নি",
    });
  }
}

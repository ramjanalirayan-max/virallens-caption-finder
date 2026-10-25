import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import {
  analyzeWithGemini,
  analyzeWithMistral,
  analyzeWithOpenAICompatible,
  runEditorPass,
  generateSmartDemoAnalysis,
  normalizeAnalysis,
  AnalysisResult,
} from "@/lib/ai-brains";
import {
  buildVisionModelChain,
  explainModelError,
  type BrainId,
} from "@/lib/model-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Gemini / Mistral need base64 without the data: prefix */
function stripDataPrefix(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    return commaIndex === -1 ? "" : trimmed.slice(commaIndex + 1);
  }
  return trimmed;
}

function decodeBase64Size(base64: string): number {
  const cleaned = base64.replace(/\s/g, "");
  return Math.floor((cleaned.length * 3) / 4);
}

function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/** Turns raw provider payloads into short, actionable messages. */
function cleanProviderMessage(raw: string): string {
  const messageMatch =
    raw.match(/"message"\s*:\s*"([^"]{3,300})"/i) ||
    raw.match(/"detail"\s*:\s*"([^"]{3,300})"/i) ||
    raw.match(/"error"\s*:\s*"([^"]{3,300})"/i);

  let message = messageMatch?.[1] || raw;

  message = message
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/not configured|missing api key|no api key/i.test(raw)) {
    return "এই ব্রেনের API key কনফিগার করা নেই। Settings → API Key দিন।";
  }
  if (/api key not valid|api_key_invalid|invalid api key/i.test(raw)) {
    return "API Key সঠিক নয়। Settings থেকে সঠিক Gemini/Mistral key দিন।";
  }
  if (/quota|rate limit|resource_exhausted|429/i.test(raw)) {
    return "API কোটা/রেট লিমিট শেষ। কিছুক্ষণ পরে চেষ্টা করুন বা অন্য key দিন।";
  }
  if (/not found|404|not supported/i.test(raw)) {
    return "এই মডেলটি আপনার key-তে পাওয়া যায়নি, বিকল্প মডেল চেষ্টা করা হচ্ছে।";
  }
  if (/billing|permission|403/i.test(raw)) {
    return "এই key-তে অনুমতি নেই (billing/permission)। Console-এ প্রজেক্ট চেক করুন।";
  }
  if (/no response|empty/i.test(raw)) {
    return "মডেল কোনো উত্তর দেয়নি, আবার চেষ্টা করুন।";
  }

  return message.slice(0, 220) || "AI service error";
}

function errorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return "Unknown AI error";
            }
          })();

  return cleanProviderMessage(raw);
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return jsonError(
        "রিকোয়েস্ট বডি পড়া যায়নি (সম্ভবত ছবিটি খুব বড়)। অনুগ্রহ করে ছোট ছবি দিয়ে আবার চেষ্টা করুন।",
        400
      );
    }

    const {
      imageBase64,
      mimeType = "image/jpeg",
      brain = "gemini",
      model,
      apiKey,
      language = "Bangla / Banglish",
      tone = "Viral & Catchy",
      objective = "Max Reach & Engagement",
      userNotes = "",
      imageTitle = "Uploaded Image Analysis",
      thumbnail = "",
      deepMode = true,
    } = body || {};

    const BRAINS = ["gemini", "mistral", "groq", "openrouter", "huggingface"] as const;
    const normalizedBrain: BrainId = BRAINS.includes(brain) ? (brain as BrainId) : "gemini";

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return jsonError("ছবির ডেটা পাওয়া যায়নি। অনুগ্রহ করে আবার ছবি আপলোড করুন।", 400);
    }

    const base64 = stripDataPrefix(imageBase64);
    if (!base64 || base64.length < 32) {
      return jsonError("ছবির ডেটা সঠিক নয়। অনুগ্রহ করে আবার ছবি আপলোড করুন।", 400);
    }

    // Explicit, JSON-only guard so the client never receives an HTML error page
    const approxBytes = decodeBase64Size(base64);
    if (approxBytes > 8 * 1024 * 1024) {
      return jsonError(
        "ছবিটি অনেক বড় (৮MB+)। অনুগ্রহ করে ছোট বা কম রেজোলিউশনের ছবি দিয়ে চেষ্টা করুন।",
        413
      );
    }

    // Ask the provider which vision models this key can actually use today.
    // This is what keeps the app working when a model is retired for new users.
    const resolution = await buildVisionModelChain(
      normalizedBrain as BrainId,
      apiKey,
      model
    );
    const modelChain = resolution.chain;
    const demoFallback = generateSmartDemoAnalysis(userNotes, language, tone, modelChain[0]);

    let result: AnalysisResult | null = null;
    const attemptErrors: string[] = [];
    let modelUsed = modelChain[0];

    for (const candidateModel of modelChain) {
      try {
        const requestOptions = {
          imageBase64: base64,
          mimeType,
          brain: normalizedBrain,
          model: candidateModel,
          apiKey,
          language,
          tone,
          objective,
          userNotes,
        };

        const raw =
          normalizedBrain === "mistral"
            ? await analyzeWithMistral(requestOptions)
            : normalizedBrain === "gemini"
              ? await analyzeWithGemini(requestOptions)
              : await analyzeWithOpenAICompatible(requestOptions);

        result = raw;
        modelUsed = candidateModel;
        break;
      } catch (error) {
        const raw = error instanceof Error ? error.message : String(error);
        const modelIssue = explainModelError(raw);
        const message = modelIssue ? `${modelIssue.code} — ${modelIssue.message}` : errorMessage(error);
        attemptErrors.push(`${candidateModel}: ${message}`);
        console.warn(`[analyze] ${normalizedBrain}/${candidateModel} failed:`, raw.slice(0, 300));
      }
    }

    let isFallback = false;
    let fallbackReason: string | null = null;
    let editorPassUsed = false;

    if (!result) {
      // Never break the user's flow – generate a rich contextual package instead.
      result = demoFallback;
      isFallback = true;
      fallbackReason = attemptErrors[0] || "AI service did not return a usable response.";
      modelUsed = `local-fallback (${modelChain[0]})`;
    } else {
      // Guarantee every section exists even if the model omitted one
      result = normalizeAnalysis(JSON.stringify(result), demoFallback);

      // PASS 2 — senior editor rewrite for sharper, less generic copy.
      // A failure here keeps the (already valid) vision output.
      if (deepMode) {
        try {
          result = await runEditorPass({
            brain: normalizedBrain,
            model: modelUsed,
            apiKey,
            language,
            tone,
            objective,
            draft: result,
          });
          editorPassUsed = true;
        } catch (editorError) {
          const message = errorMessage(editorError);
          attemptErrors.push(`editor-pass: ${message}`);
          console.warn("[analyze] editor pass skipped:", message);
        }
      }
    }

    // Persist to PostgreSQL. Thumbnails are tiny JPEGs generated in the browser.
    let savedRecordId: number | null = null;
    try {
      const [inserted] = await db
        .insert(analyses)
        .values({
          imageTitle: (imageTitle || "Social Post Analysis").slice(0, 180),
          imageThumbnail:
            typeof thumbnail === "string" && thumbnail.startsWith("data:image/")
              ? thumbnail
              : null,
          brainUsed: `${normalizedBrain} (${modelUsed})`,
          language: String(language).slice(0, 60),
          tone: String(tone).slice(0, 80),
          objective: String(objective).slice(0, 80),
          deepAnalysis: result.deepAnalysis,
          facebookOutput: result.facebookOutput,
          twitterOutput: result.twitterOutput,
          instagramOutput: result.instagramOutput,
          linkedinOutput: result.linkedinOutput,
          insights: result.insights,
        })
        .returning({ id: analyses.id });

      savedRecordId = inserted?.id ?? null;
    } catch (dbError) {
      console.error("[analyze] database save warning:", dbError);
    }

    return NextResponse.json({
      success: true,
      version: "2.1",
      analysis: result,
      savedId: savedRecordId,
      brainUsed: normalizedBrain,
      modelUsed,
      attemptedModels: modelChain,
      isFallback,
      fallbackReason,
      meta: {
        engine: isFallback ? "local-viral-engine" : normalizedBrain,
        modelUsed,
        language: String(language).slice(0, 60),
        tone: String(tone).slice(0, 80),
        objective: String(objective).slice(0, 80),
        latencyMs: Date.now() - startedAt,
        deepMode: Boolean(deepMode),
        editorPassUsed,
        qualityTier: isFallback ? "fallback" : editorPassUsed ? "editor-polished" : "vision-draft",
        attempts: attemptErrors,
        modelSource: resolution.source,
        requestedModel: resolution.requested,
        modelChain,
        discoveryError: resolution.discoveryError,
        generatedAt: new Date().toISOString(),
        payloadKb: Math.round(approxBytes / 1024),
        sections: [
          "deepAnalysis",
          "facebookOutput",
          "twitterOutput",
          "instagramOutput",
          "linkedinOutput",
          "insights",
        ],
        scores: {
          engagement: result.insights.engagementScore,
          shareability: result.insights.shareabilityScore,
          saveWorthiness: result.insights.saveWorthinessScore,
        },
      },
    });
  } catch (err) {
    console.error("[analyze] fatal error:", err);
    // Always JSON, even on catastrophe
    return jsonError(
      `বিশ্লেষণ সম্পন্ন করা যায়নি: ${errorMessage(err)}`,
      500,
      { success: false }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "/api/analyze",
    method: "POST",
    expects: ["imageBase64", "brain", "model", "language", "tone", "thumbnail"],
    geminiEnvKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    mistralEnvKey: Boolean(process.env.MISTRAL_API_KEY),
  });
}

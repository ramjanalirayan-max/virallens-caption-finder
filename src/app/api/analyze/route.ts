import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import { runAnalysisPipeline, type Effort } from "@/lib/ai-brains";
import type { BrainId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function stripDataPrefix(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const i = trimmed.indexOf(",");
    return i === -1 ? "" : trimmed.slice(i + 1);
  }
  return trimmed;
}

function decodeBase64Size(base64: string): number {
  return Math.floor((base64.replace(/\s/g, "").length * 3) / 4);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

interface AnalyzeBody {
  imageBase64?: string;
  mimeType?: string;
  brain?: string;
  model?: string;
  apiKey?: string;
  language?: string;
  tone?: string;
  objective?: string;
  userNotes?: string;
  imageTitle?: string;
  thumbnail?: string;
  variation?: number;
  effort?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: AnalyzeBody;
    try {
      body = (await req.json()) as AnalyzeBody;
    } catch {
      return jsonError(
        "রিকোয়েস্ট বডি পড়া যায়নি (সম্ভবত ছবিটি খুব বড়)। অনুগ্রহ করে ছোট ছবি দিয়ে আবার চেষ্টা করুন।",
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
      variation = 1,
      effort = "deep",
    } = body || {};

    const normalizedEffort: Effort =
      effort === "standard" || effort === "maximum" ? effort : "deep";

    const normalizedBrain: BrainId = brain === "mistral" ? "mistral" : "gemini";

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return jsonError("ছবির ডেটা পাওয়া যায়নি। অনুগ্রহ করে আবার ছবি আপলোড করুন।", 400);
    }
    const base64 = stripDataPrefix(imageBase64);
    if (!base64 || base64.length < 32) {
      return jsonError("ছবির ডেটা সঠিক নয়। অনুগ্রহ করে আবার ছবি আপলোড করুন।", 400);
    }
    if (decodeBase64Size(base64) > 8 * 1024 * 1024) {
      return jsonError("ছবিটি অনেক বড় (৮MB+)। অনুগ্রহ করে ছোট বা কম রেজোলিউশনের ছবি দিয়ে চেষ্টা করুন।", 413);
    }

    const outcome = await runAnalysisPipeline({
      imageBase64: base64,
      mimeType,
      brain: normalizedBrain,
      model,
      apiKey,
      language,
      tone,
      objective,
      userNotes,
      variation: Number(variation) || 1,
      effort: normalizedEffort,
      deadlineMs: normalizedEffort === "standard" ? 60_000 : 115_000,
      perAttemptMs: normalizedEffort === "standard" ? 50_000 : 70_000,
    });

    const { result } = outcome;
    const brainLabel = outcome.isFallback
      ? `${normalizedBrain} (${outcome.modelUsed})`
      : `${normalizedBrain} (${outcome.modelUsed})`;

    let savedRecordId: number | null = null;
    try {
      const [inserted] = await db
        .insert(analyses)
        .values({
          imageTitle: (imageTitle || "Social Post Analysis").slice(0, 180),
          imageThumbnail:
            typeof thumbnail === "string" && thumbnail.startsWith("data:image/") ? thumbnail : null,
          brainUsed: brainLabel,
          modelUsed: outcome.modelUsed,
          language: String(language).slice(0, 60),
          tone: String(tone).slice(0, 80),
          objective: String(objective).slice(0, 80),
          deepAnalysis: result.deepAnalysis,
          facebookOutput: result.facebookOutput,
          twitterOutput: result.twitterOutput,
          instagramOutput: result.instagramOutput,
          linkedinOutput: result.linkedinOutput,
          strategyOutput: { ...result.strategy, qcScore: outcome.quality.score },
          qualityMeta: outcome.meta,
          viralScore: result.strategy.viralScore,
        })
        .returning({ id: analyses.id });
      savedRecordId = inserted?.id ?? null;
    } catch (dbError) {
      console.error("[analyze] database save warning:", dbError);
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      savedId: savedRecordId,
      brainUsed: normalizedBrain,
      modelUsed: outcome.modelUsed,
      attempts: outcome.attempts,
      meta: outcome.meta,
      passes: outcome.meta.passes ?? [],
      quality: outcome.quality,
      effort: outcome.effort,
      latencyMs: outcome.latencyMs,
      isFallback: outcome.isFallback,
      isPartial: outcome.isPartial,
      fallbackReason: outcome.fallbackReason,
    });
  } catch (err) {
    console.error("[analyze] fatal error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`বিশ্লেষণ সম্পন্ন করা যায়নি: ${message.slice(0, 200)}`, 500);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "/api/analyze",
    method: "POST",
    version: 3,
    expects: ["imageBase64", "brain", "model", "language", "tone", "thumbnail", "variation", "effort"],
    efforts: ["standard", "deep", "maximum"],
    geminiEnvKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    mistralEnvKey: Boolean(process.env.MISTRAL_API_KEY),
  });
}

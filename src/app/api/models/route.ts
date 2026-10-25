import { NextRequest, NextResponse } from "next/server";
import { discoverModelsForBrain, type BrainId } from "@/lib/model-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Returns the vision models the user's keys can actually use right now. */
export async function POST(req: NextRequest) {
  let body: {
    geminiKey?: string;
    mistralKey?: string;
    groqKey?: string;
    openrouterKey?: string;
    huggingfaceKey?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    // empty body allowed – server env keys will be used
  }

  const brains: BrainId[] = ["gemini", "mistral", "groq", "openrouter", "huggingface"];
  const keys: Record<BrainId, string | undefined> = {
    gemini: body.geminiKey,
    mistral: body.mistralKey,
    groq: body.groqKey,
    openrouter: body.openrouterKey,
    huggingface: body.huggingfaceKey,
  };

  const results = await Promise.all(brains.map((brain) => discoverModelsForBrain(brain, keys[brain])));

  return NextResponse.json({
    success: true,
    ...Object.fromEntries(
      brains.map((brain, index) => [
        brain,
        {
          models: results[index].models,
          source: results[index].source,
          error: results[index].error ?? null,
        },
      ])
    ),
    checkedAt: new Date().toISOString(),
  });
}

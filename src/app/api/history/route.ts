import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const favoritesOnly = searchParams.get("favorites") === "true";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30));

    const rows = await db
      .select({
        id: analyses.id,
        imageTitle: analyses.imageTitle,
        imageThumbnail: analyses.imageThumbnail,
        brainUsed: analyses.brainUsed,
        modelUsed: analyses.modelUsed,
        language: analyses.language,
        tone: analyses.tone,
        deepAnalysis: analyses.deepAnalysis,
        facebookOutput: analyses.facebookOutput,
        twitterOutput: analyses.twitterOutput,
        instagramOutput: analyses.instagramOutput,
        linkedinOutput: analyses.linkedinOutput,
        strategyOutput: analyses.strategyOutput,
        qualityMeta: analyses.qualityMeta,
        viralScore: analyses.viralScore,
        isFavorite: analyses.isFavorite,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(limit);

    const items = favoritesOnly ? rows.filter((r) => r.isFavorite) : rows;
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch history", items: [] }, { status: 500 });
  }
}

interface SaveBody {
  analysis?: Partial<AnalysisResult>;
  imageTitle?: string;
  thumbnail?: string;
  brainUsed?: string;
  modelUsed?: string;
  language?: string;
  tone?: string;
  objective?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBody;
    const { analysis, imageTitle, thumbnail, brainUsed, modelUsed, language, tone, objective } = body || {};

    if (!analysis?.deepAnalysis || !analysis?.facebookOutput || !analysis?.twitterOutput || !analysis?.instagramOutput) {
      return NextResponse.json(
        { success: false, error: "A complete analysis object is required" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(analyses)
      .values({
        imageTitle: (imageTitle || "Social Post Analysis").slice(0, 180),
        imageThumbnail:
          typeof thumbnail === "string" && thumbnail.startsWith("data:image/") ? thumbnail : null,
        brainUsed: (brainUsed || "local-fallback").slice(0, 120),
        modelUsed: (modelUsed || brainUsed || "local-fallback").slice(0, 120),
        language: (language || "Bangla / Banglish").slice(0, 60),
        tone: (tone || "Viral & Catchy").slice(0, 80),
        objective: (objective || "Max Reach & Engagement").slice(0, 80),
        deepAnalysis: analysis.deepAnalysis,
        facebookOutput: analysis.facebookOutput,
        twitterOutput: analysis.twitterOutput,
        instagramOutput: analysis.instagramOutput,
        linkedinOutput: analysis.linkedinOutput ?? null,
        strategyOutput: analysis.strategy ?? null,
        qualityMeta: null,
        viralScore: analysis.strategy?.viralScore ?? null,
      })
      .returning({ id: analyses.id });

    return NextResponse.json({ success: true, savedId: inserted?.id ?? null });
  } catch (error) {
    console.error("Save analysis error:", error);
    return NextResponse.json({ success: false, error: "Failed to save analysis" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, isFavorite } = (await req.json()) as { id?: number; isFavorite?: boolean };
    if (!id || typeof isFavorite !== "boolean") {
      return NextResponse.json({ success: false, error: "id and isFavorite are required" }, { status: 400 });
    }
    await db.update(analyses).set({ isFavorite }).where(eq(analyses.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update favorite error:", error);
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }
    await db.delete(analyses).where(eq(analyses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const favoritesOnly = searchParams.get("favorites") === "true";
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const query = db
      .select({
        id: analyses.id,
        imageTitle: analyses.imageTitle,
        imageThumbnail: analyses.imageThumbnail,
        brainUsed: analyses.brainUsed,
        language: analyses.language,
        tone: analyses.tone,
        deepAnalysis: analyses.deepAnalysis,
        facebookOutput: analyses.facebookOutput,
        twitterOutput: analyses.twitterOutput,
        instagramOutput: analyses.instagramOutput,
        linkedinOutput: analyses.linkedinOutput,
        insights: analyses.insights,
        isFavorite: analyses.isFavorite,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(limit);

    const results = await query;
    const filtered = favoritesOnly ? results.filter((r) => r.isFavorite) : results;

    return NextResponse.json({
      success: true,
      items: filtered,
    });
  } catch (error: any) {
    console.error("Fetch history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis history", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { analysis, imageTitle, thumbnail, brainUsed, language, tone, objective } = body || {};

    if (!analysis?.deepAnalysis || !analysis?.facebookOutput) {
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
          typeof thumbnail === "string" && thumbnail.startsWith("data:image/")
            ? thumbnail
            : null,
        brainUsed: (brainUsed || "local-fallback").slice(0, 120),
        language: (language || "Bangla / Banglish").slice(0, 60),
        tone: (tone || "Viral & Catchy").slice(0, 80),
        objective: (objective || "Max Reach & Engagement").slice(0, 80),
        deepAnalysis: analysis.deepAnalysis,
        facebookOutput: analysis.facebookOutput,
        twitterOutput: analysis.twitterOutput,
        instagramOutput: analysis.instagramOutput,
        linkedinOutput: analysis.linkedinOutput ?? null,
        insights: analysis.insights ?? null,
      })
      .returning({ id: analyses.id });

    return NextResponse.json({ success: true, savedId: inserted?.id ?? null });
  } catch (error) {
    console.error("Save analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save analysis" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isFavorite } = body;

    if (!id || typeof isFavorite !== "boolean") {
      return NextResponse.json(
        { error: "ID and isFavorite boolean required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(analyses)
      .set({ isFavorite })
      .where(eq(analyses.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (!id) {
      return NextResponse.json({ error: "Valid ID required" }, { status: 400 });
    }

    await db.delete(analyses).where(eq(analyses.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

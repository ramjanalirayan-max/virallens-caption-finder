import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PLATFORM_RULES: Record<string, string> = {
  Facebook:
    "Facebook post: keep a scroll-stopping first line, short paragraphs with blank lines, 2-6 tasteful emojis, end with a comment-bait question. No hashtags inside the body unless already present.",
  Twitter:
    "X / Twitter post: HARD LIMIT 270 characters total. Max 1 emoji. Max 2 hashtags. One idea, punchy.",
  Instagram:
    "Instagram caption: hook line first, airy short lines, no '.' ladders, tasteful emojis, end with a save/share CTA. Keep hashtags out of the body.",
  LinkedIn:
    "LinkedIn post: professional yet human, hook → short story → takeaway → question, max 2 emojis.",
};

function cleanOutput(text: string, platform: string): string {
  let out = (text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```$/i, "")
    .replace(/^\s*(revised|updated|here(?:'s| is)[^:\n]*):\s*/i, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();
  out = out.replace(/^["“”']+|["“”']+$/g, "").trim();
  if (platform === "Twitter" && Array.from(out).length > 280) {
    const chars = Array.from(out).slice(0, 277).join("");
    const cut = Math.max(chars.lastIndexOf(". "), chars.lastIndexOf("। "), chars.lastIndexOf(" "));
    out = `${chars.slice(0, cut > 120 ? cut : chars.length).trim()}…`;
  }
  return out;
}

function localRefine(currentText: string, instruction: string, platform: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes("short") || lower.includes("ছোট")) {
    const first = currentText.split(/\n+/).filter(Boolean);
    return first.slice(0, 2).join("\n");
  }
  if (lower.includes("emoji") || lower.includes("ইমোজি")) {
    if (platform === "Twitter") return `✨ ${currentText} 🔥`;
    return `✨ ${currentText}\n\n🔥 আপনার মতামত কমেন্টে জানান! 💬`;
  }
  if (lower.includes("bangla") || lower.includes("বাংলা")) {
    return `${currentText}\n\nসত্যি বলতে, এই মুহূর্তটাই আসল সুখ। আপনার কেমন লাগলো? ❤️`;
  }
  if (lower.includes("english") || lower.includes("ইংলিশ")) {
    return `${currentText}\n\nSave this for later — and tell me what this moment means to you. ✨`;
  }
  if (lower.includes("question") || lower.includes("প্রশ্ন")) {
    return `${currentText}\n\nআপনি হলে এই মুহূর্তে কী করতেন? 👇`;
  }
  return `${currentText}\n\n💬 আপনার মতামত কী? কমেন্টে জানিয়ে দিন!`;
}

export async function POST(req: NextRequest) {
  let payload: {
    currentText?: string;
    refinementPrompt?: string;
    platform?: string;
    brain?: string;
    model?: string;
    apiKey?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const { currentText, refinementPrompt, platform = "Facebook", brain = "gemini", model, apiKey } = payload;
  if (!currentText || !refinementPrompt) {
    return NextResponse.json(
      { success: false, error: "currentText and refinementPrompt are required" },
      { status: 400 }
    );
  }

  const prompt = `You are an elite social media copywriter. Rewrite the post below according to the user's instruction.

PLATFORM RULES: ${PLATFORM_RULES[platform] || PLATFORM_RULES.Facebook}
LANGUAGE: keep the same language/script mix as the original unless the instruction asks to change it. If writing Bangla, write natural modern Bangla as Dhaka creators do — never textbook phrasing.

ORIGINAL POST:
"""
${currentText}
"""

INSTRUCTION: ${refinementPrompt}

Return ONLY the rewritten post text. No preamble, no quotes, no markdown, no explanations.`;

  let revisedText = "";
  let source: "ai" | "local" = "local";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    if (brain === "mistral") {
      const key = apiKey?.trim() || process.env.MISTRAL_API_KEY;
      if (key) {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: model && !/pixtral/i.test(model) ? model : "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          revisedText = data.choices?.[0]?.message?.content?.trim() || "";
          if (revisedText) source = "ai";
        }
      }
    } else {
      const key = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (key) {
        const geminiModel = model || "gemini-2.5-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.75, maxOutputTokens: 2048 },
            }),
            signal: controller.signal,
          }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
          };
          revisedText =
            (data.candidates?.[0]?.content?.parts || [])
              .filter((p) => !p.thought)
              .map((p) => p.text || "")
              .join("")
              .trim() || "";
          if (revisedText) source = "ai";
        }
      }
    }
    clearTimeout(timer);
  } catch (error) {
    console.warn("[refine] provider error:", error instanceof Error ? error.message : error);
  }

  if (!revisedText) revisedText = localRefine(currentText, refinementPrompt, platform);

  return NextResponse.json({ success: true, revisedText: cleanOutput(revisedText, platform), source });
}

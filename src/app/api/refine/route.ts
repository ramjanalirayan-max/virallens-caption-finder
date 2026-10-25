import { NextRequest, NextResponse } from "next/server";
import { OPENAI_COMPATIBLE_PROVIDERS } from "@/lib/model-registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currentText,
      refinementPrompt,
      platform,
      model,
      apiKey,
    } = body as {
      currentText?: string;
      refinementPrompt?: string;
      platform?: string;
      brain?: string;
      model?: string;
      apiKey?: string;
    };
    const brain: "gemini" | "mistral" | "groq" | "openrouter" | "huggingface" =
      body?.brain === "mistral" ||
      body?.brain === "groq" ||
      body?.brain === "openrouter" ||
      body?.brain === "huggingface"
        ? body.brain
        : "gemini";

    if (!currentText || !refinementPrompt) {
      return NextResponse.json(
        { error: "currentText and refinementPrompt are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert social media growth copywriter.
Target Platform: ${platform || "Social Media"}
Original Post Content:
"${currentText}"

User's refinement request:
"${refinementPrompt}"

Provide an upgraded, highly engaging revision. Return only the revised caption/content without markdown chatter or explanations. Keep emojis and formatting clean.`;

    let revisedText = "";

    if (brain === "groq" || brain === "openrouter" || brain === "huggingface") {
      const provider = OPENAI_COMPATIBLE_PROVIDERS[brain];
      const providerKey =
        apiKey?.trim() || provider.envKeys.map((name) => process.env[name]).find(Boolean);
      if (providerKey) {
        const response = await fetch(provider.chatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${providerKey}`,
            ...(provider.extraHeaders || {}),
          },
          body: JSON.stringify({
            model: model || provider.defaults[0],
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.75,
            max_tokens: 2048,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          revisedText = data.choices?.[0]?.message?.content?.trim();
        }
      }
    } else if (brain === "mistral") {
      const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
      if (mistralKey) {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mistralKey}`,
          },
          body: JSON.stringify({
            model: model || "mistral-small-latest",
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.7,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          revisedText = data.choices?.[0]?.message?.content?.trim();
        }
      }
    } else {
      // Gemini
      const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        const geminiModel = model || "gemini-2.5-flash";
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: { temperature: 0.75 },
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          revisedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        }
      }
    }

    // Fallback if no direct AI call succeeded
    if (!revisedText) {
      if (refinementPrompt.toLowerCase().includes("bangla")) {
        revisedText = `${currentText}\n\n✨ এই মুহূর্তটা মনের খুব কাছাকাছি। আপনার কেমন লাগলো জানাতে ভুলবেন না! ❤️`;
      } else if (refinementPrompt.toLowerCase().includes("emoji")) {
        revisedText = `🔥 💫 ${currentText} 📸 ✨ 🚀`;
      } else if (refinementPrompt.toLowerCase().includes("short")) {
        revisedText = currentText.split("\n")[0] || currentText;
      } else {
        revisedText = `${currentText}\n\n(Enhanced for high viral engagement)`;
      }
    }

    return NextResponse.json({ success: true, revisedText });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Refinement failed" },
      { status: 500 }
    );
  }
}

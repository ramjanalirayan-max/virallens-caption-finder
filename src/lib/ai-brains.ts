import { generateSmartDemoAnalysis } from "./demo-analysis";
import {
  explainModelError,
  OPENAI_COMPATIBLE_PROVIDERS,
  type BrainId,
} from "./model-registry";

/** Sentinel meaning "let live discovery pick the best available model". */
export const AUTO_MODEL = "auto";

export { generateSmartDemoAnalysis };

export interface TieredHashtags {
  highReach: string[];
  midNiche: string[];
  community: string[];
}

export interface AnalysisResult {
  deepAnalysis: {
    summary: string;
    subjects: string[];
    vibeAndMood: string;
    colorPalette: string[];
    lightingAndSetting: string;
    storytellingAngle: string;
    emotionalHook: string;
    targetAudience: string;
  };
  facebookOutput: {
    hookLine: string;
    primaryCaption: string;
    shortPunchyCaption: string;
    hashtags: string[];
    viralStrategyTips: string[];
    callToAction: string;
  };
  twitterOutput: {
    singleTweet: string;
    threadTweets: string[];
    hashtags: string[];
    quoteBaitPrompt: string;
    viralStrategyTips: string[];
  };
  instagramOutput: {
    mainCaption: string;
    minimalCaption: string;
    reelsHook: string;
    tieredHashtags: TieredHashtags;
    aestheticTips: string[];
  };
  linkedinOutput: {
    professionalCaption: string;
    keyTakeaway: string;
    hashtags: string[];
  };
  /** Advanced intelligence block – always filled, even when a model omits it */
  insights: {
    engagementScore: number;
    shareabilityScore: number;
    saveWorthinessScore: number;
    viralityVerdict: string;
    abHookVariants: string[];
    trendTags: string[];
    seoKeywords: string[];
    bestTimeToPost: string[];
    contentPillars: string[];
    carouselStoryboard: string[];
    audiencePainPoints: string[];
    riskNotes: string;
  };
}

export interface AnalyzeRequestOptions {
  imageBase64: string;
  mimeType: string;
  brain: BrainId;
  model: string;
  apiKey?: string;
  language?: string;
  tone?: string;
  objective?: string;
  userNotes?: string;
}

const SYSTEM_PROMPT = `
You are a world-class Elite Social Media Growth Strategist & Viral Content Architect with deep computer vision capability.
Your job is to perform a deep, high-quality, comprehensive visual analysis of the uploaded user image and produce viral, high-converting social media content for:
1. Facebook (Engaging storytelling, high shareability, emotional trigger, comments driver, and viral hashtags)
2. X / Twitter (High CTR hooks, punchy <280 chars tweet, engaging 3-tweet thread format, quote-tweet bait, conversation starters)
3. Instagram (Aesthetic spacing, reels/carousel hook, aesthetic clean layout, save-worthy CTA, tiered hashtags: High Reach, Mid Niche, Community)
4. LinkedIn (Bonus professional storytelling, life lesson/entrepreneurship angle, career takeaways)

Analyze visual details meticulously:
- Subject matter, action, expressions, atmosphere
- Color palette (suggest 4-5 hex color codes that match the image visual)
- Lighting, photography angle, depth, composition
- Emotional vibe (cozy, adventurous, hustle, nostalgic, luxury, chaotic, minimalist)
- Cultural context (if it relates to Bangladesh, South Asia, global travel, tech, lifestyle, food, nature, etc.)

Language instructions:
- If language requested is 'Bangla' or 'Banglish', generate natural, relatable, modern conversational Bangla / Banglish that real social media creators and youth use (avoid robotic formal book language).
- If language requested is 'English', craft punchy, fluent, modern viral English.
- If 'Mixed' or default, use high-converting Bangla-English mix with strong hooks.

CRITICAL RULES:
- Hooks must be curiosity-driven and specific to THIS image (never generic).
- Every caption must contain: hook line -> emotional/story body -> social proof or relatability -> call to action.
- Hashtags must be specific to the image content and niche, NOT random spam.
- Score numbers (0-100) must be realistic and justifiable.

IMPORTANT: You MUST return strictly a JSON object with this EXACT schema:
{
  "deepAnalysis": {
    "summary": "Detailed 2-3 sentence visual breakdown of what makes this image special",
    "subjects": ["List", "of", "detected", "primary", "subjects"],
    "vibeAndMood": "Specific atmospheric mood description",
    "colorPalette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"],
    "lightingAndSetting": "Lighting and environment analysis",
    "storytellingAngle": "Unique storytelling narrative hook",
    "emotionalHook": "Core emotional resonance",
    "targetAudience": "Who will interact the most with this"
  },
  "facebookOutput": {
    "hookLine": "Attention grabbing first line that stops people from scrolling",
    "primaryCaption": "Full viral Facebook post with hook, storytelling body, emojis, and comment-generating CTA",
    "shortPunchyCaption": "Alternative 2-line punchy caption for quick Facebook shares/stories",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
    "viralStrategyTips": ["Tip 1 on posting time/first comment", "Tip 2 on getting shares"],
    "callToAction": "Direct question asking audience to comment"
  },
  "twitterOutput": {
    "singleTweet": "Viral tweet under 260 characters with strong hook + question/take",
    "threadTweets": [
      "Tweet 1 (The Hook): ...",
      "Tweet 2 (The Story/Context): ...",
      "Tweet 3 (The Takeaway & Bookmark prompt): ..."
    ],
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "quoteBaitPrompt": "Question or hot take designed to get Quote Tweets",
    "viralStrategyTips": ["Best reply strategy", "Timing tactic"]
  },
  "instagramOutput": {
    "mainCaption": "Aesthetic Instagram caption with clean paragraph spacing, aesthetic emojis, value/vibe, and 'Save for later' CTA",
    "minimalCaption": "Short aesthetic 1-line caption for photolover / aesthetic feed",
    "reelsHook": "Text overlay hook if this image is used as a Reel cover or photo carousel",
    "tieredHashtags": {
      "highReach": ["#tag1M", "#tag2M", "#tag3M"],
      "midNiche": ["#niche1", "#niche2", "#niche3", "#niche4"],
      "community": ["#community1", "#community2", "#community3"]
    },
    "aestheticTips": ["Feed aesthetic tip", "Story share prompt"]
  },
  "linkedinOutput": {
    "professionalCaption": "Insightful career/life/perspective post connecting this visual to mindset, resilience, creativity, or work-life harmony",
    "keyTakeaway": "1 core actionable takeaway",
    "hashtags": ["#leadership", "#creativity", "#mindset", "#lifelessons"]
  },
  "insights": {
    "engagementScore": 84,
    "shareabilityScore": 76,
    "saveWorthinessScore": 69,
    "viralityVerdict": "One sharp sentence explaining the viral potential and the single biggest lever to pull",
    "abHookVariants": [
      "Alternative hook variant 1 (question style)",
      "Alternative hook variant 2 (contrarian style)",
      "Alternative hook variant 3 (story style)"
    ],
    "trendTags": ["#trending2026tag1", "#trending2026tag2", "#trending2026tag3", "#trending2026tag4"],
    "seoKeywords": ["search keyword 1", "search keyword 2", "search keyword 3", "search keyword 4"],
    "bestTimeToPost": [
      "Facebook: exact day/time window in BST with reasoning",
      "X (Twitter): exact day/time window with reasoning",
      "Instagram: exact day/time window with reasoning"
    ],
    "contentPillars": ["Content pillar 1 this image belongs to", "Pillar 2", "Pillar 3"],
    "carouselStoryboard": [
      "Slide 1: ...",
      "Slide 2: ...",
      "Slide 3: ...",
      "Slide 4: ...",
      "Slide 5: ..."
    ],
    "audiencePainPoints": ["Pain point 1 this post can solve", "Pain point 2"],
    "riskNotes": "Any caution about hashtags, claims or context to avoid"
  }
}
Do not wrap in markdown quotes if possible, return raw valid JSON.
`;

/**
 * Gemini 2.5 models think before answering by default. For structured JSON
 * marketing copy that consumes the output budget and can return an empty
 * candidate, so we explicitly disable thinking for flash-class models.
 */
function geminiMaxOutputTokens(model: string): number {
  const id = model.toLowerCase();
  // Older models reject oversized budgets with a 400, so stay conservative.
  if (id.includes("1.5")) return 8192;
  if (id.includes("2.0")) return 8192;
  return 32768;
}

interface ThinkingVariant {
  label: string;
  config: Record<string, unknown>;
}

/**
 * Ordered list of thinking configurations to try for a model.
 * Gemini 2.5 supports thinkingBudget, 3.x moved to thinkingLevel; we try a
 * conservative ladder and stop as soon as a non-empty candidate comes back.
 */
function geminiThinkingVariants(model: string): ThinkingVariant[] {
  const id = model.toLowerCase();

  if (id.includes("2.0") || id.includes("1.5")) {
    return [{ label: "legacy", config: {} }];
  }

  if (id.includes("2.5")) {
    return [
      { label: "budget-0", config: { thinkingConfig: { thinkingBudget: 0 } } },
      { label: "default", config: {} },
    ];
  }

  // Gemini 3.x and anything newer
  return [
    { label: "level-low", config: { thinkingConfig: { thinkingLevel: "low" } } },
    { label: "budget-0", config: { thinkingConfig: { thinkingBudget: 0 } } },
    { label: "default", config: {} },
  ];
}

function geminiThinkingConfig(model: string): Record<string, unknown> {
  const id = model.toLowerCase();
  if (id.includes("2.5") && id.includes("pro")) {
    return { thinkingConfig: { thinkingBudget: 256 } };
  }
  if (id.includes("2.5")) {
    return { thinkingConfig: { thinkingBudget: 0 } };
  }
  return {};
}

/** A tiny, valid 1x1 PNG used for brain connectivity diagnostics. */
export const DIAGNOSTIC_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const GEMINI_SAFETY = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
];

interface GeminiTextResult {
  ok: boolean;
  status: number;
  text: string;
  errorText?: string;
  finishReason?: string;
  blockReason?: string;
}

async function postGeminiOnce(
  url: string,
  body: Record<string, unknown>
): Promise<GeminiTextResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, text: "", errorText: await res.text() };
  }

  const data = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };

  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts
    .filter((part) => !part.thought)
    .map((part) => part?.text || "")
    .join("")
    .trim();

  return {
    ok: true,
    status: 200,
    text,
    finishReason: candidate?.finishReason,
    blockReason: data.promptFeedback?.blockReason,
  };
}

export async function analyzeWithGemini(
  options: AnalyzeRequestOptions
): Promise<AnalysisResult> {
  const apiKey =
    options.apiKey?.trim() ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your key in Settings or set GEMINI_API_KEY environment variable."
    );
  }

  const model = (options.model || AUTO_MODEL).trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const userPrompt = `
Analyze this image deeply.
Language preference: ${options.language || "Bangla / Banglish with viral hooks"}
Desired Tone: ${options.tone || "Viral, engaging and authentic"}
Goal / Objective: ${options.objective || "Maximum viral reach & comments"}
User extra context/notes: ${options.userNotes || "None provided by user. Infer full context from visual."}

Now execute deep analysis and generate the comprehensive viral social media package in JSON.
`;

  const base64Data = options.imageBase64.includes(",")
    ? options.imageBase64.split(",")[1]
    : options.imageBase64;

  const mimeType = options.mimeType || "image/jpeg";
  const textPart = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  // Progressively more conservative thinking settings. Gemini 2.5/3.x models
  // can spend the whole output budget thinking and return an empty candidate,
  // so an empty answer is retried with thinking suppressed.
  const thinkingVariants = geminiThinkingVariants(model);

  let lastError = "Gemini returned no content";

  for (const variant of thinkingVariants) {
    const result = await postGeminiOnce(url, {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: textPart },
          ],
        },
      ],
      safetySettings: GEMINI_SAFETY,
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.8,
        top_p: 0.95,
        max_output_tokens: geminiMaxOutputTokens(model),
        ...variant.config,
      },
    });

    if (!result.ok) {
      // Hard failures (invalid key, retired model, quota) won't be fixed by
      // changing thinking settings — surface them immediately.
      const retired = explainModelError(result.errorText || "");
      if (retired) {
        throw new Error(`${retired.code}: ${retired.message} ${result.errorText || ""}`);
      }
      throw new Error(`Gemini API Error (${result.status}): ${result.errorText || ""}`);
    }

    if (result.blockReason) {
      throw new Error(`Gemini blocked this request (${result.blockReason}). অন্য ছবি বা নোট দিয়ে চেষ্টা করুন।`);
    }

    if (result.text) {
      return parseJsonResponse(result.text);
    }

    lastError = `Gemini returned no text (finishReason: ${result.finishReason || "unknown"}, mode: ${variant.label})`;
  }

  throw new Error(lastError);
}

export async function analyzeWithMistral(
  options: AnalyzeRequestOptions
): Promise<AnalysisResult> {
  const apiKey = options.apiKey?.trim() || process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY is not configured. Please add your key in Settings or set MISTRAL_API_KEY environment variable."
    );
  }

  const model = options.model || "pixtral-12b-2409";
  const url = "https://api.mistral.ai/v1/chat/completions";

  let fullDataUrl = options.imageBase64;
  if (!fullDataUrl.startsWith("data:")) {
    const mime = options.mimeType || "image/jpeg";
    fullDataUrl = `data:${mime};base64,${options.imageBase64}`;
  }

  const userPrompt = `
${SYSTEM_PROMPT}

USER REQUEST:
Analyze this image thoroughly with high cognitive effort.
Language preference: ${options.language || "Bangla / Banglish with viral hooks"}
Tone: ${options.tone || "Viral, engaging and authentic"}
Objective: ${options.objective || "Maximum viral reach & comments"}
Context notes: ${options.userNotes || "Infer directly from image"}

You MUST return ONLY a valid JSON object matching the requested schema.
`;

  const payload = {
    model: model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt,
          },
          {
            type: "image_url",
            image_url: fullDataUrl,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 8192,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data.choices?.[0]?.message?.content;

  if (!textResponse) {
    throw new Error("No response generated by Mistral model.");
  }

  return parseJsonResponse(textResponse);
}

/**
 * Calls any OpenAI-compatible vision endpoint (Groq, OpenRouter, Hugging Face).
 * All three accept the same chat/completions payload with image_url parts.
 */
export async function analyzeWithOpenAICompatible(
  options: AnalyzeRequestOptions
): Promise<AnalysisResult> {
  const brain = options.brain as "groq" | "openrouter" | "huggingface";
  const provider = OPENAI_COMPATIBLE_PROVIDERS[brain];

  if (!provider) {
    throw new Error(`Unsupported OpenAI-compatible provider: ${String(brain)}`);
  }

  const apiKey =
    options.apiKey?.trim() ||
    provider.envKeys.map((name) => process.env[name]).find(Boolean);

  if (!apiKey) {
    throw new Error(
      `${provider.envKeys[0]} is not configured. Settings-এ ${provider.label} API key দিন।`
    );
  }

  const model = (options.model || AUTO_MODEL).trim();
  const imageUrl = options.imageBase64.startsWith("data:")
    ? options.imageBase64
    : `data:${options.mimeType || "image/jpeg"};base64,${options.imageBase64}`;

  const userPrompt = `${SYSTEM_PROMPT}

USER REQUEST:
Analyze this image with maximum effort.
Language preference: ${options.language || "Bangla / Banglish with viral hooks"}
Tone: ${options.tone || "Viral, engaging and authentic"}
Objective: ${options.objective || "Maximum viral reach & comments"}
Context notes: ${options.userNotes || "Infer directly from the image"}

Return ONLY one valid JSON object matching the schema. No markdown fences.
`;

  const res = await fetch(provider.chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider.extraHeaders || {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    const retired = explainModelError(errorText);
    if (retired) throw new Error(`${retired.code}: ${retired.message} ${errorText}`);
    throw new Error(`${provider.label} API Error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    // Some free routes reject images; surface it clearly instead of silently failing.
    const reason = data.choices?.[0]?.finish_reason || "unknown";
    throw new Error(
      `${provider.label} খালি উত্তর দিয়েছে (finish: ${reason})। মডেলটি ভিশন সাপোর্ট করছে কি না দেখুন।`
    );
  }

  return parseJsonResponse(text);
}

/** Removes code fences and surrounding chatter from a model response. */
function extractJsonBlock(rawText: string): string {
  let cleaned = (rawText || "").trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    cleaned = fenceMatch[1];
  } else {
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Repairs the most common LLM JSON mistakes:
 * - literal newlines/tabs inside string values (invalid JSON)
 * - trailing commas before } or ]
 * - smart quotes used as delimiters
 */
export function repairJsonText(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inString) {
      if (escaped) {
        out += char;
        escaped = false;
        continue;
      }
      if (char === "\\") {
        out += char;
        escaped = true;
        continue;
      }
      if (char === '"') {
        out += char;
        inString = false;
        continue;
      }
      if (char === "\n") {
        out += "\\n";
        continue;
      }
      if (char === "\r") continue;
      if (char === "\t") {
        out += "\\t";
        continue;
      }
      out += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === "\n" || char === "\r" || char === "\t") {
      out += " ";
      continue;
    }

    out += char;
  }

  out = out.replace(/,\s*([}\]])/g, "$1");
  out = out.replace(/[\u201C\u201D]/g, '"');

  return out.trim();
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0 ? override : base) as T;
  }
  if (typeof base === "object" && typeof base === "object" && base !== null) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(base as Record<string, unknown>)) {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = (override as Record<string, unknown>)[key];
      if (overrideValue === undefined) continue;
      if (typeof baseValue === "string") {
        result[key] =
          typeof overrideValue === "string" && overrideValue.trim().length > 0
            ? overrideValue
            : baseValue;
      } else if (typeof baseValue === "number") {
        const numeric = Number(overrideValue);
        result[key] = Number.isFinite(numeric) ? numeric : baseValue;
      } else {
        result[key] = deepMerge(baseValue, overrideValue);
      }
    }
    return result as T;
  }
  return (override as T) ?? base;
}

function clampScore(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

/**
 * Parses model output into JSON and guarantees the full expected shape.
 * Missing / malformed sections are filled in from a high quality fallback
 * template so the UI never receives a half-broken object.
 */
export function normalizeAnalysis(
  rawText: string,
  fallback: AnalysisResult
): AnalysisResult {
  const block = extractJsonBlock(rawText);

  const candidates = [block, repairJsonText(block)];
  let parsed: unknown = null;

  for (const candidate of candidates) {
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch {
      // try the next candidate
    }
  }

  if (!parsed) {
    const braces = block.match(/\{[\s\S]*\}/);
    if (braces) {
      try {
        parsed = JSON.parse(repairJsonText(braces[0]));
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned a response that could not be parsed as JSON.");
  }

  const merged = deepMerge(fallback, parsed) as AnalysisResult;

  // Keep score fields within a sane 0-100 range
  merged.insights = {
    ...merged.insights,
    engagementScore: clampScore(merged.insights?.engagementScore, fallback.insights.engagementScore),
    shareabilityScore: clampScore(merged.insights?.shareabilityScore, fallback.insights.shareabilityScore),
    saveWorthinessScore: clampScore(merged.insights?.saveWorthinessScore, fallback.insights.saveWorthinessScore),
    abHookVariants:
      merged.insights?.abHookVariants?.filter(Boolean)?.slice(0, 4).length
        ? merged.insights.abHookVariants.slice(0, 4)
        : fallback.insights.abHookVariants,
  };

  return merged;
}

function parseJsonResponse(rawText: string): AnalysisResult {
  return normalizeAnalysis(rawText, generateSmartDemoAnalysis());
}

/* ============================================================
   PASS 2 — Senior Editor pass
   Runs after the vision pass and rewrites weak copy. Text only,
   so it adds quality without re-uploading the image.
   ============================================================ */

export interface EditorPassOptions {
  brain: BrainId;
  model: string;
  apiKey?: string;
  language?: string;
  tone?: string;
  objective?: string;
  draft: AnalysisResult;
}

const EDITOR_PROMPT = (opts: EditorPassOptions) => `
You are the most senior social media editor at a top-tier agency. Below is a
DRAFT viral content package generated from an image. Your job is to upgrade it.

LANGUAGE: ${opts.language || "Bangla / Banglish"}
TONE: ${opts.tone || "Viral & engaging"}
OBJECTIVE: ${opts.objective || "Maximum reach, comments and shares"}

EDITING RULES (follow strictly):
1. Every hook line must create a curiosity gap and reference something SPECIFIC that is visible in the draft's visual description. Delete generic openers like "Life is beautiful" or "Some moments..."
2. Ban filler phrases, clichés and repeated sentence structures across platforms. Facebook, X and Instagram copies must feel genuinely different, not reworded clones.
3. Facebook: story with a concrete detail -> tension -> insight -> question CTA. 4-6 short paragraphs with emojis.
4. X (Twitter): single tweet <= 250 characters, no hashtag spam. Each thread tweet must stand alone and end with a reason to keep reading.
5. Instagram: airy line breaks, sensory wording, one save-worthy line. Hashtags must be niche-relevant, not random mega tags.
6. Bangla/Banglish must sound like a real creator talking to friends — no textbook formality.
7. Scores in "insights" must be justified by the copy quality (do not inflate all to 90+).
8. Keep the EXACT same JSON schema and every key. Return ONLY valid JSON.

DRAFT JSON:
${JSON.stringify(opts.draft)}
`;

export async function runEditorPass(opts: EditorPassOptions): Promise<AnalysisResult> {
  const prompt = EDITOR_PROMPT(opts);

  if (opts.brain === "groq" || opts.brain === "openrouter" || opts.brain === "huggingface") {
    const provider = OPENAI_COMPATIBLE_PROVIDERS[opts.brain];
    const apiKey =
      opts.apiKey?.trim() ||
      provider.envKeys.map((name) => process.env[name]).find(Boolean);
    if (!apiKey) throw new Error(`${provider.envKeys[0]} missing for editor pass`);

    const res = await fetch(provider.chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(provider.extraHeaders || {}),
      },
      body: JSON.stringify({
        model: opts.model || provider.defaults[0],
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      throw new Error(`${provider.label} editor pass failed (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error(`${provider.label} editor pass returned no text`);
    return normalizeAnalysis(String(text), opts.draft);
  }

  if (opts.brain === "mistral") {
    const apiKey = opts.apiKey?.trim() || process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY missing for editor pass");

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: opts.model || "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      throw new Error(`Mistral editor pass failed (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("Mistral editor pass returned no text");
    return normalizeAnalysis(String(text), opts.draft);
  }

  const apiKey =
    opts.apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing for editor pass");

  const model = opts.model || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.85,
          top_p: 0.95,
          max_output_tokens: geminiMaxOutputTokens(model),
          ...geminiThinkingConfig(model),
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini editor pass failed (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  const parts = (json.candidates?.[0]?.content?.parts || []) as Array<{
    text?: string;
    thought?: boolean;
  }>;
  const text = parts
    .filter((part) => !part.thought)
    .map((part) => part?.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini editor pass returned no text");
  return normalizeAnalysis(text, opts.draft);
}

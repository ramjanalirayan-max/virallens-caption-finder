/* =========================================================
   ViralLens AI Engine v3
   Gemini + Mistral vision brains · structured output ·
   JSON salvage · quality polish · multi-model pipeline
   ========================================================= */

import type {
  AnalysisResult,
  AttemptInfo,
  BrainId,
  EngineResult,
  PipelineOutcome,
  QualityMeta,
} from "./types";
import { generateSmartDemoAnalysis, HASHTAG_POOLS } from "./demo-analysis";

export type * from "./types";
export { generateSmartDemoAnalysis };

export const GEMINI_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];
export const MISTRAL_CHAIN = [
  "pixtral-12b-2409",
  "pixtral-large-latest",
  "mistral-small-latest",
  "mistral-medium-latest",
];

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
  variation?: number;
  signal?: AbortSignal;
}

export class ProviderError extends Error {
  status: number;
  provider: BrainId;
  constructor(provider: BrainId, status: number, message: string) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.status = status;
  }
}

/* ---------------------------------------------------------
   PROMPTS
--------------------------------------------------------- */

const LANGUAGE_GUIDES: Record<string, string> = {
  "Bangla / Banglish":
    "Write the way popular Dhaka creators actually post in 2026: natural modern বাংলা script for most sentences, with everyday English words kept in Latin where people really say them (vibe, weekend, mood, save). Short sentences, warm and witty. ZERO textbook phrasing (never: অত্যন্ত, নিঃসন্দেহে, উপভোগ করুন, সুন্দর মুহূর্ত). Hashtags in English.",
  "Pure Bangla":
    "Write in polished প্রমিত বাংলা — literary yet easy to read, no English words inside sentences (brand names allowed). Use বাংলা punctuation (।). Hashtags in English.",
  English:
    "Write fluent, punchy, modern internet English with rhythm: short lines, specific nouns, zero corporate filler.",
  Mixed:
    "Code-switch naturally between বাংলা and English at sentence level (roughly 50/50), the way bilingual Gen-Z creators post. Hashtags in English.",
};

function languageGuide(language?: string): string {
  if (!language) return LANGUAGE_GUIDES["Bangla / Banglish"];
  return LANGUAGE_GUIDES[language] ?? `Write in: ${language}. Natural, human, platform-native. Hashtags in English.`;
}

export const SYSTEM_PROMPT = `You are ViralLens — an elite social media growth strategist, creative director and multimodal vision analyst with 15+ years growing pages in Bangladesh, South Asia and global feeds. You write content that real humans post and that 2026 feed algorithms actually reward.

Work in three silent steps, then output ONE JSON object.

## STEP 1 — LOOK (like a photo editor, thoroughly)
- Main subject(s), secondary elements, actions, expressions, body language
- Composition: framing, rule of thirds, leading lines, depth, negative space, orientation
- Light: source, quality (hard/soft), time of day, colour temperature, shadows
- Colour: 4-5 dominant colours as exact 6-digit HEX sampled from what you actually see
- Any visible text, logos, brands, signage, UI, watermark — quote it verbatim or say "None detected"
- Setting & cultural context: region, season, festival, street/home/nature/studio; Bangladeshi / South Asian cues if present
- Thumb-stop factor: what makes a scrolling thumb pause within 0.8 seconds — or why it would not
- The specific audience that will care most (never "everyone")

## STEP 2 — STRATEGISE
- Score virality honestly 0-100 with four sub-scores. Ordinary photos land 35-65; only exceptional images score 80+. Never inflate.
- Choose the best format per platform (feed photo / carousel / reel cover / story)
- Posting windows in Bangladesh time (BST, UTC+6) unless the image is clearly from elsewhere
- Name the 2026 trends this image can ride (real-over-produced, quiet life, nostalgia, POV hooks, photo dumps, ambient Reels, etc.)

## STEP 3 — WRITE (platform-native, specific to THIS image)
FACEBOOK: a hook line (first 5-9 words that stop the scroll), a storytelling body of 3-5 short paragraphs separated by blank lines, an emotional payoff, then a comment-bait question. 8-12 hashtags mixing broad + niche. A first-comment line.
X / TWITTER: ONE tweet ≤ 240 characters (hard limit), 0-2 hashtags inside it, max 1 emoji. A 3-tweet thread (each ≤ 250 characters, numbered 1/3 2/3 3/3). A quote-tweet bait take. Alt text describing the image.
INSTAGRAM: hook line first, aesthetic spacing (short lines, blank lines — NEVER "." ladders), value/vibe, save/share CTA. Hashtags in 3 tiers: 5 high-reach (1M+ posts), 7 mid-niche (100k-800k), 5 community (<100k) — all relevant to the actual image. A Reels/carousel text-overlay hook, a 4-slide carousel idea, alt text.
LINKEDIN: one insight-led professional post (hook → short story → takeaway → question), max 2 emojis, 4-5 hashtags.

## HARD RULES
- Every sentence must be specific to what is visible. Generic filler ("this beautiful picture", "stunning view") is a failure.
- Banned clichés: "in today's fast-paced world", "elevate", "unleash", "journey" as metaphor, "game-changer", "dive in".
- Emojis: Facebook/Instagram 2-6 tasteful, X ≤ 1, LinkedIn ≤ 2. Never start every line with an emoji.
- Hashtags start with #, no spaces, no emojis, Latin letters/digits only, deduplicated.
- Colours as 6-digit hex like "#1B2A41".
- Numbers are plain integers 0-100.
- Respect the requested language and tone exactly.
- Output ONLY the JSON object. No markdown fences, no commentary before or after.`;

const OUTPUT_SHAPE = `{
  "deepAnalysis": {
    "summary": "3 sentences: what the image is, why it works (or not) for social, the one thing that makes it distinctive",
    "subjects": ["4-6 detected elements, specific (e.g. 'steaming clay cup of chai', not 'drink')"],
    "vibeAndMood": "one vivid sentence",
    "colorPalette": ["#HEX", "#HEX", "#HEX", "#HEX", "#HEX"],
    "lightingAndSetting": "light source, quality, time of day, environment",
    "compositionNotes": "framing, depth, negative space, crop advice",
    "textInImage": "verbatim visible text/logos or 'None detected'",
    "culturalContext": "region/season/cultural cues and how they affect the audience",
    "storytellingAngle": "the narrative angle the captions use",
    "emotionalHook": "the core emotion and why it resonates",
    "targetAudience": "specific audience with age range and interests",
    "thumbStopFactor": "what stops the scroll in 0.8s (or what is missing)"
  },
  "strategy": {
    "viralScore": 0,
    "scoreBreakdown": { "visualImpact": 0, "emotionalPull": 0, "shareability": 0, "trendFit": 0 },
    "verdict": "one honest sentence about this image's organic potential",
    "bestPostingTimes": { "facebook": "...", "twitter": "...", "instagram": "..." },
    "recommendedFormat": "best format(s) across platforms",
    "hookVariants": ["3 alternative first lines with different angles: curiosity, emotion, bold statement"],
    "imageImprovementTips": ["3-4 concrete edits before posting: crop ratio, exposure, text overlay zone, etc."],
    "trendAlignment": "which 2026 trends this rides and how",
    "contentPillars": ["3-5 short pillar tags"],
    "firstCommentStrategy": "exact first-comment tactic for this post"
  },
  "facebookOutput": {
    "hookLine": "the scroll-stopping first line",
    "primaryCaption": "full post: hook line, 3-5 short paragraphs with blank lines, payoff, CTA question",
    "shortPunchyCaption": "2-line alternative for stories/quick shares",
    "hashtags": ["#tag", "... 8-12 total"],
    "viralStrategyTips": ["4 tactics specific to this post"],
    "callToAction": "the direct comment-bait question",
    "firstComment": "what to post as your own first comment"
  },
  "twitterOutput": {
    "singleTweet": "≤ 240 characters",
    "threadTweets": ["1/3 ...", "2/3 ...", "3/3 ..."],
    "hashtags": ["#tag", "#tag"],
    "quoteBaitPrompt": "a take/question engineered for quote tweets",
    "viralStrategyTips": ["3 tactics"],
    "altText": "accessible description of the image"
  },
  "instagramOutput": {
    "mainCaption": "hook first, airy spacing, value, save/share CTA",
    "minimalCaption": "one aesthetic line",
    "reelsHook": "text overlay for a Reel cover / first carousel slide",
    "tieredHashtags": { "highReach": ["5 tags"], "midNiche": ["7 tags"], "community": ["5 tags"] },
    "aestheticTips": ["3 tips: crop, audio, posting format"],
    "carouselIdea": "4-slide carousel plan",
    "altText": "accessible description"
  },
  "linkedinOutput": {
    "professionalCaption": "hook → short story → takeaway → question",
    "keyTakeaway": "one actionable line",
    "hashtags": ["4-5 tags"]
  }
}`;

function buildUserPrompt(options: AnalyzeRequestOptions, outputBudget = 16384): string {
  const today = new Date().toISOString().slice(0, 10);
  const variation = options.variation && options.variation > 1 ? options.variation : 1;
  return `Analyse the attached image with maximum care.

User context: ${options.userNotes?.trim() || "(none — infer everything from the image)"}
Language: ${options.language || "Bangla / Banglish"} → ${languageGuide(options.language)}
Tone: ${options.tone || "Viral & Catchy"}
Objective: ${options.objective || "Maximum organic reach, saves and comments"}
Today's date: ${today} (use for seasonal / trend relevance)
Creative variation #${variation}${variation > 1 ? " — take a noticeably different creative angle than the most obvious one." : ""}

EFFORT: maximum. Think hard before writing, then write long, specific, publish-ready content.

MINIMUM LENGTHS (falling short of these is a failed response):
- facebookOutput.primaryCaption: 500-1100 characters, 4-6 short paragraphs separated by one blank line
- instagramOutput.mainCaption: 300-1100 characters, airy short lines
- twitterOutput.singleTweet: 90-240 characters (never over 240)
- linkedinOutput.professionalCaption: 400-900 characters
- deepAnalysis.summary: 3 full sentences (min 180 characters)
- every *_Tips / hookVariants / strategy array: exactly the requested count, each item a full specific sentence

Return ONLY a JSON object with exactly this shape (fill every field, keep the keys unchanged). You have ~${Math.round(outputBudget / 1000)}k output tokens available — use them; do not summarise:
${OUTPUT_SHAPE}`;
}

/* ---------------------------------------------------------
   GEMINI structured-output schema (OpenAPI subset)
--------------------------------------------------------- */

type GSchema = Record<string, unknown>;
const S = (description?: string): GSchema => ({ type: "STRING", ...(description ? { description } : {}) });
const I = (description?: string): GSchema => ({ type: "INTEGER", ...(description ? { description } : {}) });
const A = (items: GSchema, description?: string): GSchema => ({
  type: "ARRAY",
  items,
  ...(description ? { description } : {}),
});
const O = (properties: Record<string, GSchema>): GSchema => ({
  type: "OBJECT",
  properties,
  required: Object.keys(properties),
});

const GEMINI_RESPONSE_SCHEMA: GSchema = O({
  deepAnalysis: O({
    summary: S(),
    subjects: A(S()),
    vibeAndMood: S(),
    colorPalette: A(S("6-digit hex colour")),
    lightingAndSetting: S(),
    compositionNotes: S(),
    textInImage: S(),
    culturalContext: S(),
    storytellingAngle: S(),
    emotionalHook: S(),
    targetAudience: S(),
    thumbStopFactor: S(),
  }),
  strategy: O({
    viralScore: I("0-100"),
    scoreBreakdown: O({
      visualImpact: I("0-100"),
      emotionalPull: I("0-100"),
      shareability: I("0-100"),
      trendFit: I("0-100"),
    }),
    verdict: S(),
    bestPostingTimes: O({ facebook: S(), twitter: S(), instagram: S() }),
    recommendedFormat: S(),
    hookVariants: A(S()),
    imageImprovementTips: A(S()),
    trendAlignment: S(),
    contentPillars: A(S()),
    firstCommentStrategy: S(),
  }),
  facebookOutput: O({
    hookLine: S(),
    primaryCaption: S(),
    shortPunchyCaption: S(),
    hashtags: A(S()),
    viralStrategyTips: A(S()),
    callToAction: S(),
    firstComment: S(),
  }),
  twitterOutput: O({
    singleTweet: S("max 240 characters"),
    threadTweets: A(S("max 250 characters each")),
    hashtags: A(S()),
    quoteBaitPrompt: S(),
    viralStrategyTips: A(S()),
    altText: S(),
  }),
  instagramOutput: O({
    mainCaption: S(),
    minimalCaption: S(),
    reelsHook: S(),
    tieredHashtags: O({ highReach: A(S()), midNiche: A(S()), community: A(S()) }),
    aestheticTips: A(S()),
    carouselIdea: S(),
    altText: S(),
  }),
  linkedinOutput: O({
    professionalCaption: S(),
    keyTakeaway: S(),
    hashtags: A(S()),
  }),
});

const SAFETY_SETTINGS = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function stripDataPrefix(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const i = trimmed.indexOf(",");
    return i === -1 ? "" : trimmed.slice(i + 1);
  }
  return trimmed;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 2000);
  } catch {
    return `HTTP ${response.status}`;
  }
}

/* ---------------------------------------------------------
   GEMINI
--------------------------------------------------------- */

type GeminiMode = "json" | "schema";
type GeminiVersion = "v1beta" | "v1";

interface GeminiCallResult {
  engine: EngineResult;
  finishReason?: string;
  usage?: { input: number; output: number; thoughts: number };
}

async function geminiCall(
  apiKey: string,
  model: string,
  options: AnalyzeRequestOptions,
  base64: string,
  mode: GeminiMode,
  version: GeminiVersion,
  fallback: AnalysisResult,
  maxOutputTokens: number
): Promise<GeminiCallResult> {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
  const isThinking = /gemini-(2\.5|3)/i.test(model);

  const generationConfig: Record<string, unknown> = {
    // NOTE: no forced responseSchema on the main path — a fully-`required` schema
    // makes Gemini emit the shortest possible value for every field, which
    // produces terse/generic captions. JSON mime + a precise prompt gives
    // Mistral-grade (actually better) prose.
    responseMimeType: "application/json",
    temperature: mode === "schema" ? 0.7 : 0.9,
    topP: 0.95,
    maxOutputTokens,
  };

  if (mode === "schema") generationConfig.responseSchema = GEMINI_RESPONSE_SCHEMA;
  if (isThinking) {
    // Generous reasoning budget: higher thinking measurably improves
    // specificity (colour, composition, cultural cues) and hook quality.
    generationConfig.thinkingConfig = {
      thinkingBudget: /flash-lite/i.test(model) ? 1024 : /pro/i.test(model) ? 4096 : 3072,
    };
  }

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: options.mimeType || "image/jpeg", data: base64 } },
          { text: buildUserPrompt(options, maxOutputTokens) },
        ],
      },
    ],
    generationConfig,
    safetySettings: SAFETY_SETTINGS,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new ProviderError("gemini", response.status, await readErrorBody(response));
  }

  const data = (await response.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      finishReason?: string;
    }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  };

  if (data.promptFeedback?.blockReason) {
    throw new ProviderError(
      "gemini",
      422,
      `Gemini এই ছবিটি block করেছে (${data.promptFeedback.blockReason})। অন্য ছবি দিয়ে চেষ্টা করুন।`
    );
  }

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new ProviderError(
      "gemini",
      502,
      `Gemini কোনো টেক্সট দেয়নি (finishReason: ${candidate?.finishReason || "unknown"})।`
    );
  }

  return {
    engine: polishFromText(text, fallback, candidate?.finishReason),
    finishReason: candidate?.finishReason,
    usage: {
      input: data.usageMetadata?.promptTokenCount ?? 0,
      output: data.usageMetadata?.candidatesTokenCount ?? 0,
      thoughts: data.usageMetadata?.thoughtsTokenCount ?? 0,
    },
  };
}

function outputBudgetFor(model: string): number {
  if (/gemini-(2\.5|3)/i.test(model)) return 65536; // thinking tokens come out of this
  return 16384;
}

async function geminiRequest(
  apiKey: string,
  model: string,
  options: AnalyzeRequestOptions,
  base64: string,
  fallback: AnalysisResult
): Promise<EngineResult> {
  const budget = outputBudgetFor(model);

  // v1beta first; a few restricted keys only expose v1
  for (const version of ["v1beta", "v1"] as GeminiVersion[]) {
    try {
      const primary = await geminiCall(apiKey, model, options, base64, "json", version, fallback, budget);
      if (primary.engine.meta.completeness >= 55) return primary.engine;
      // Rich-but-partial → try the constrained schema once to fill the gaps
      try {
        const strict = await geminiCall(apiKey, model, options, base64, "schema", version, fallback, budget);
        return strict.engine.meta.completeness > primary.engine.meta.completeness
          ? strict.engine
          : primary.engine;
      } catch {
        return primary.engine;
      }
    } catch (error) {
      const status = error instanceof ProviderError ? error.status : -1;
      // wrong endpoint / model not on this API version → try the other version
      if (status === 404 && version === "v1beta") continue;
      throw error;
    }
  }
  throw new ProviderError("gemini", 502, "Gemini request failed on both API versions.");
}

export async function analyzeWithGemini(options: AnalyzeRequestOptions): Promise<EngineResult> {
  const apiKey = options.apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new ProviderError("gemini", 0, "GEMINI_API_KEY নেই। Settings-এ Gemini key যোগ করুন অথবা Mistral brain ব্যবহার করুন।");
  }
  const model = options.model || GEMINI_CHAIN[0];
  const fallback = generateSmartDemoAnalysis(options.userNotes, options.language, options.tone, model);
  const base64 = stripDataPrefix(options.imageBase64);
  return geminiRequest(apiKey, model, options, base64, fallback);
}

/* ---------------------------------------------------------
   MISTRAL
--------------------------------------------------------- */

async function mistralRequest(
  apiKey: string,
  model: string,
  options: AnalyzeRequestOptions,
  dataUrl: string,
  mode: "strict" | "relaxed",
  fallback: AnalysisResult
): Promise<EngineResult> {
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(options, 8192) },
          { type: "image_url", image_url: dataUrl },
        ],
      },
    ],
    temperature: 0.85,
    top_p: 0.95,
    max_tokens: 16384,
  };
  if (mode === "strict") payload.response_format = { type: "json_object" };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new ProviderError("mistral", response.status, await readErrorBody(response));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> }; finish_reason?: string }>;
  };

  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  const text = (Array.isArray(content) ? content.map((c) => c.text || "").join("") : content || "").trim();

  if (!text) {
    throw new ProviderError("mistral", 502, "Mistral কোনো কনটেন্ট দেয়নি।");
  }

  return polishFromText(text, fallback, choice?.finish_reason);
}

export async function analyzeWithMistral(options: AnalyzeRequestOptions): Promise<EngineResult> {
  const apiKey = options.apiKey?.trim() || process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new ProviderError("mistral", 0, "MISTRAL_API_KEY নেই। Settings-এ Mistral key যোগ করুন।");
  }

  const model = options.model || MISTRAL_CHAIN[0];
  const fallback = generateSmartDemoAnalysis(options.userNotes, options.language, options.tone, model);
  const base64 = stripDataPrefix(options.imageBase64);
  const dataUrl = `data:${options.mimeType || "image/jpeg"};base64,${base64}`;

  try {
    return await mistralRequest(apiKey, model, options, dataUrl, "strict", fallback);
  } catch (error) {
    if (error instanceof ProviderError && (error.status === 400 || error.status === 422) && /response_format|json/i.test(error.message)) {
      return mistralRequest(apiKey, model, options, dataUrl, "relaxed", fallback);
    }
    throw error;
  }
}

/* ---------------------------------------------------------
   JSON extraction, repair & salvage
--------------------------------------------------------- */

/** Strips fences/chatter before the JSON. Keeps everything after the first "{" (may be truncated). */
function extractJsonBlock(rawText: string): string {
  let cleaned = (rawText || "").trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) cleaned = fence[1];
  else {
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  const first = cleaned.indexOf("{");
  return first > 0 ? cleaned.slice(first) : cleaned;
}

/** Trims trailing commentary after the last "}" */
function toLastBrace(text: string): string {
  const last = text.lastIndexOf("}");
  return last !== -1 ? text.slice(0, last + 1) : text;
}

export function repairJsonText(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") continue;
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "\n" || ch === "\r" || ch === "\t") {
      out += " ";
      continue;
    }
    out += ch;
  }

  out = out.replace(/,\s*([}\]])/g, "$1");
  out = out.replace(/[\u201C\u201D]/g, '"');
  return out.trim();
}

/** Closes a JSON document that was cut off by a token limit. */
export function salvageTruncatedJson(input: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let out = input;
  if (inString) out += '"';
  out = out.replace(/[\s,]+$/, "");
  if (/:\s*$/.test(out)) out += '""';

  // A dangling key with no value → drop it
  const dangling = out.match(/[{,]\s*"(?:[^"\\]|\\.)*"\s*$/);
  if (dangling) out = out.slice(0, out.length - dangling[0].length + 1);
  out = out.replace(/[\s,]+$/, "");

  while (stack.length) {
    const open = stack.pop();
    out += open === "{" ? "}" : "]";
  }
  return out;
}

function tryParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrapRoot(parsed: unknown): unknown {
  if (Array.isArray(parsed)) return unwrapRoot(parsed[0]);
  if (!parsed || typeof parsed !== "object") return parsed;
  const obj = parsed as Record<string, unknown>;
  if ("deepAnalysis" in obj || "facebookOutput" in obj) return obj;
  const values = Object.values(obj).filter((v) => v && typeof v === "object");
  if (values.length === 1) return unwrapRoot(values[0]);
  return obj;
}

export function parseModelJson(rawText: string): { parsed: unknown; salvaged: boolean } {
  const block = extractJsonBlock(rawText);
  const trimmed = toLastBrace(block);

  // 1) clean parses (whole text, then with trailing chatter removed, each with repairs)
  const candidates = [block, repairJsonText(block), trimmed, repairJsonText(trimmed)];
  for (const candidate of candidates) {
    const parsed = tryParse(candidate);
    if (parsed && typeof parsed === "object") return { parsed: unwrapRoot(parsed), salvaged: false };
  }

  // 2) output was cut off by a token limit → close it and keep what we have
  const salvaged = tryParse(repairJsonText(salvageTruncatedJson(block)));
  if (salvaged && typeof salvaged === "object") return { parsed: unwrapRoot(salvaged), salvaged: true };

  const salvagedTrimmed = tryParse(repairJsonText(salvageTruncatedJson(trimmed)));
  if (salvagedTrimmed && typeof salvagedTrimmed === "object") return { parsed: unwrapRoot(salvagedTrimmed), salvaged: true };

  throw new Error("AI returned a response that could not be parsed as JSON.");
}

/* ---------------------------------------------------------
   Merge + completeness
--------------------------------------------------------- */

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0 ? override : base) as T;
  }
  if (typeof base === "object" && base !== null && typeof override === "object") {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(base as Record<string, unknown>)) {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = (override as Record<string, unknown>)[key];
      if (overrideValue === undefined || overrideValue === null) continue;
      if (typeof baseValue === "string") {
        result[key] = typeof overrideValue === "string" && overrideValue.trim().length > 0 ? overrideValue : baseValue;
      } else if (typeof baseValue === "number") {
        const n = typeof overrideValue === "string" ? Number(overrideValue) : overrideValue;
        result[key] = typeof n === "number" && Number.isFinite(n) ? n : baseValue;
      } else {
        result[key] = deepMerge(baseValue, overrideValue);
      }
    }
    return result as T;
  }
  return (override as T) ?? base;
}

function leafPaths(obj: unknown, prefix: string[] = []): string[][] {
  if (Array.isArray(obj)) return [prefix];
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leafPaths(v, [...prefix, k]));
  }
  return [prefix];
}

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function isFilled(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 1;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.some((x) => (typeof x === "string" ? x.trim().length > 0 : x != null));
  return false;
}

function computeCompleteness(parsed: unknown, template: AnalysisResult): number {
  const paths = leafPaths(template);
  if (paths.length === 0) return 0;
  const filled = paths.filter((p) => isFilled(getPath(parsed, p))).length;
  return Math.round((filled / paths.length) * 100);
}

/* ---------------------------------------------------------
   Polish: text cleanup + platform constraints
--------------------------------------------------------- */

function cleanText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*(?:tweet\s*\d+\s*(?:\([^)]*\))?\s*[:\-–]\s*)/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();
}

function cleanDeep<T>(value: T): T {
  if (typeof value === "string") return cleanText(value) as T;
  if (Array.isArray(value)) return value.map((v) => cleanDeep(v)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = cleanDeep(v);
    return out as T;
  }
  return value;
}

function clampLength(text: string, limit: number): { text: string; trimmed: boolean } {
  const chars = Array.from(text);
  if (chars.length <= limit) return { text, trimmed: false };
  const slice = chars.slice(0, limit - 1).join("");
  const cut = Math.max(
    slice.lastIndexOf("। "),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("\n")
  );
  let base: string;
  if (cut > limit * 0.5) base = slice.slice(0, cut + 1);
  else {
    const space = slice.lastIndexOf(" ");
    base = space > limit * 0.4 ? slice.slice(0, space) : slice;
  }
  base = base.trim();
  return { text: /[.!?।]$/.test(base) ? base : `${base}…`, trimmed: true };
}

function normalizeHashtags(
  input: unknown,
  min: number,
  max: number,
  pool: string[],
  label: string,
  repairs: string[]
): string[] {
  const list: string[] = Array.isArray(input)
    ? input.filter((x): x is string => typeof x === "string")
    : typeof input === "string"
      ? input.split(/[\s,]+/)
      : [];

  const seen = new Set<string>();
  const out: string[] = [];
  let dropped = 0;

  for (const raw of list) {
    const tag = raw.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    if (!tag || /^\d+$/.test(tag)) {
      dropped += 1;
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    out.push(`#${tag}`);
    if (out.length >= max) break;
  }

  if (dropped > 0) repairs.push(`${label}: ${dropped} invalid/duplicate hashtag(s) removed`);

  if (out.length < min) {
    for (const p of pool) {
      const key = p.replace(/^#/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p.startsWith("#") ? p : `#${p}`);
      if (out.length >= min) break;
    }
    repairs.push(`${label}: hashtag list topped up to ${out.length}`);
  }
  return out;
}

function normalizeHex(value: string): string | null {
  const m = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h.toUpperCase()}`;
}

function clampScore(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function polishAnalysis(parsed: unknown, fallback: AnalysisResult): EngineResult {
  const repairs: string[] = [];
  const completeness = computeCompleteness(parsed, fallback);
  const merged = cleanDeep(deepMerge(fallback, parsed));

  /* --- colours --- */
  const palette = merged.deepAnalysis.colorPalette
    .map((c) => normalizeHex(String(c)))
    .filter((c): c is string => Boolean(c));
  if (palette.length !== merged.deepAnalysis.colorPalette.length) repairs.push("Invalid colour codes removed");
  merged.deepAnalysis.colorPalette = palette.length >= 3 ? palette.slice(0, 6) : fallback.deepAnalysis.colorPalette;

  /* --- scores --- */
  const sb = merged.strategy.scoreBreakdown;
  merged.strategy.scoreBreakdown = {
    visualImpact: clampScore(sb.visualImpact, fallback.strategy.scoreBreakdown.visualImpact),
    emotionalPull: clampScore(sb.emotionalPull, fallback.strategy.scoreBreakdown.emotionalPull),
    shareability: clampScore(sb.shareability, fallback.strategy.scoreBreakdown.shareability),
    trendFit: clampScore(sb.trendFit, fallback.strategy.scoreBreakdown.trendFit),
  };
  const avg = Math.round(
    (merged.strategy.scoreBreakdown.visualImpact +
      merged.strategy.scoreBreakdown.emotionalPull +
      merged.strategy.scoreBreakdown.shareability +
      merged.strategy.scoreBreakdown.trendFit) /
      4
  );
  const modelScore = getPath(parsed, ["strategy", "viralScore"]);
  merged.strategy.viralScore = clampScore(modelScore, avg);
  if (!isFilled(modelScore)) repairs.push("Viral score derived from sub-scores");

  /* --- facebook --- */
  merged.facebookOutput.hashtags = normalizeHashtags(
    merged.facebookOutput.hashtags,
    8,
    14,
    HASHTAG_POOLS.facebook,
    "Facebook",
    repairs
  );
  if (!merged.facebookOutput.hookLine || merged.facebookOutput.hookLine.length < 4) {
    merged.facebookOutput.hookLine = merged.facebookOutput.primaryCaption.split("\n")[0].slice(0, 120);
    repairs.push("Facebook hook derived from caption");
  }

  /* --- twitter --- */
  const tweet = clampLength(merged.twitterOutput.singleTweet, 280);
  if (tweet.trimmed) repairs.push("Tweet trimmed to 280 characters");
  merged.twitterOutput.singleTweet = tweet.text;

  merged.twitterOutput.threadTweets = merged.twitterOutput.threadTweets
    .filter((t) => t && t.trim().length > 0)
    .slice(0, 5)
    .map((t, i) => {
      const c = clampLength(t, 280);
      if (c.trimmed) repairs.push(`Thread tweet ${i + 1} trimmed`);
      return c.text;
    });
  if (merged.twitterOutput.threadTweets.length < 3) {
    merged.twitterOutput.threadTweets = [
      ...merged.twitterOutput.threadTweets,
      ...fallback.twitterOutput.threadTweets.slice(merged.twitterOutput.threadTweets.length),
    ];
    repairs.push("Thread completed to 3 tweets");
  }
  merged.twitterOutput.hashtags = normalizeHashtags(merged.twitterOutput.hashtags, 1, 4, HASHTAG_POOLS.twitter, "X", repairs);

  /* --- instagram --- */
  const tiers = merged.instagramOutput.tieredHashtags;
  merged.instagramOutput.tieredHashtags = {
    highReach: normalizeHashtags(tiers.highReach, 4, 7, HASHTAG_POOLS.igHigh, "IG high-reach", repairs),
    midNiche: normalizeHashtags(tiers.midNiche, 5, 9, HASHTAG_POOLS.igMid, "IG mid-niche", repairs),
    community: normalizeHashtags(tiers.community, 3, 7, HASHTAG_POOLS.igCommunity, "IG community", repairs),
  };
  // keep tiers mutually exclusive
  const seen = new Set<string>();
  (["highReach", "midNiche", "community"] as const).forEach((tier) => {
    merged.instagramOutput.tieredHashtags[tier] = merged.instagramOutput.tieredHashtags[tier].filter((t) => {
      const k = t.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

  /* --- linkedin --- */
  merged.linkedinOutput.hashtags = normalizeHashtags(merged.linkedinOutput.hashtags, 3, 6, HASHTAG_POOLS.linkedin, "LinkedIn", repairs);

  /* --- strategy lists --- */
  merged.strategy.hookVariants = merged.strategy.hookVariants.filter(Boolean).slice(0, 4);
  if (merged.strategy.hookVariants.length === 0) merged.strategy.hookVariants = [merged.facebookOutput.hookLine];
  merged.strategy.contentPillars = merged.strategy.contentPillars.map((p) => p.replace(/^#/, "")).filter(Boolean).slice(0, 6);

  return {
    result: merged,
    meta: { completeness, repairs: Array.from(new Set(repairs)) },
  };
}

export function polishFromText(rawText: string, fallback: AnalysisResult, finishReason?: string): EngineResult {
  const { parsed, salvaged } = parseModelJson(rawText);
  const engine = polishAnalysis(parsed, fallback);
  if (salvaged) engine.meta.repairs.unshift("Truncated JSON was salvaged");
  engine.meta.finishReason = finishReason;
  engine.meta.truncated = salvaged || /MAX_TOKENS|length/i.test(finishReason || "");
  return engine;
}

/* ---------------------------------------------------------
   Error humanisation
--------------------------------------------------------- */

export function humanizeProviderError(error: unknown, brain: BrainId): string {
  const providerName = brain === "mistral" ? "Mistral" : "Gemini";
  if (error instanceof Error && error.name === "AbortError") {
    return `${providerName} সময়মতো উত্তর দেয়নি (timeout)। আবার চেষ্টা করুন বা ছোট ছবি দিন।`;
  }
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error ?? "Unknown error");
  const status = error instanceof ProviderError ? error.status : 0;

  if (status === 0 && /not configured/i.test(raw)) return raw;
  if (/api key not valid|api_key_invalid|invalid api key|unauthorized|401/i.test(raw) || status === 401) {
    return `${providerName} API key সঠিক নয়। Settings থেকে সঠিক key দিন।`;
  }
  if (status === 429 || /quota|rate limit|resource_exhausted/i.test(raw)) {
    return `${providerName} কোটা/রেট লিমিট শেষ (429)। কিছুক্ষণ পরে চেষ্টা করুন।`;
  }
  if (status === 404 || /not found|is not supported|does not exist/i.test(raw)) {
    return `মডেলটি এই key-তে পাওয়া যায়নি (404) — বিকল্প মডেল চেষ্টা করা হয়েছে।`;
  }
  if (status === 403 || /permission|billing/i.test(raw)) {
    return `${providerName} key-তে অনুমতি নেই (403: billing/permission)।`;
  }
  if (status >= 500) return `${providerName} সার্ভার সমস্যা (HTTP ${status})। একটু পরে আবার চেষ্টা করুন।`;
  if (/blocked/i.test(raw)) return raw;
  if (/could not be parsed/i.test(raw)) return `${providerName} অসম্পূর্ণ JSON পাঠিয়েছে — আবার চেষ্টা করুন।`;

  const m = raw.match(/"message"\s*:\s*"([^"]{3,200})"/i);
  const msg = (m?.[1] || raw).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return `${providerName}: ${msg.slice(0, 180)}`;
}

/* ---------------------------------------------------------
   QUALITY SCORING — measurable, not vibes
--------------------------------------------------------- */

export interface QualityReport {
  score: number;
  issues: string[];
}

const L = (v: unknown) => Array.from(String(v ?? "")).length;
const hasQuestion = (v: string) => /[?？]/.test(v || "");

export function scoreAnalysisQuality(r: AnalysisResult): QualityReport {
  const issues: string[] = [];
  let score = 100;
  const penal = (n: number, msg: string) => {
    score -= n;
    issues.push(msg);
  };

  const d = r.deepAnalysis;
  if (L(d.summary) < 160) penal(8, `summary ছোট (${L(d.summary)} chars)`);
  if (d.subjects.length < 4) penal(4, `subjects কম (${d.subjects.length})`);
  if (d.colorPalette.length < 4) penal(5, `color palette কম (${d.colorPalette.length})`);
  if (L(d.compositionNotes) < 40) penal(4, "composition analysis নেই");
  if (L(d.thumbStopFactor) < 30) penal(4, "thumb-stop factor নেই");
  if (L(d.culturalContext) < 30) penal(3, "cultural context নেই");

  const fb = r.facebookOutput;
  if (L(fb.primaryCaption) < 400) penal(12, `Facebook caption ছোট (${L(fb.primaryCaption)} chars, target 500+)`);
  if (L(fb.primaryCaption) > 1900) penal(3, "Facebook caption অতিরিক্ত দীর্ঘ");
  if (L(fb.hookLine) < 14) penal(8, `hook line দুর্বল (${L(fb.hookLine)} chars)`);
  if (fb.hashtags.length < 8) penal(6, `Facebook hashtag কম (${fb.hashtags.length}/8)`);
  if (!hasQuestion(fb.callToAction)) penal(4, "CTA-তে comment-bait প্রশ্ন নেই");
  if (fb.viralStrategyTips.length < 4) penal(4, `Facebook tips কম (${fb.viralStrategyTips.length}/4)`);
  if (L(fb.firstComment) < 15) penal(3, "first comment নেই");
  if (!/\n\n/.test(fb.primaryCaption)) penal(4, "caption-এ paragraph ভাগ নেই");

  const tw = r.twitterOutput;
  const twLen = L(tw.singleTweet);
  if (twLen < 70) penal(7, `tweet ছোট (${twLen} chars)`);
  if (twLen > 280) penal(8, `tweet বেশি দীর্ঘ (${twLen}/280)`);
  if (tw.threadTweets.length < 3) penal(5, `thread অসম্পূর্ণ (${tw.threadTweets.length}/3)`);
  if (L(tw.quoteBaitPrompt) < 20) penal(4, "quote-bait দুর্বল");
  if (L(tw.altText) < 30) penal(3, "X alt text নেই");

  const ig = r.instagramOutput;
  if (L(ig.mainCaption) < 250) penal(10, `Instagram caption ছোট (${L(ig.mainCaption)} chars)`);
  const igTotal =
    ig.tieredHashtags.highReach.length + ig.tieredHashtags.midNiche.length + ig.tieredHashtags.community.length;
  if (igTotal < 14) penal(7, `Instagram hashtag কম (${igTotal}/17)`);
  if (ig.tieredHashtags.highReach.length < 4) penal(3, "IG high-reach tier কম");
  if (ig.tieredHashtags.midNiche.length < 5) penal(3, "IG mid-niche tier কম");
  if (L(ig.reelsHook) < 15) penal(4, "Reels hook নেই");
  if (L(ig.carouselIdea) < 30) penal(3, "carousel idea নেই");
  if (ig.aestheticTips.length < 3) penal(3, "IG tips কম");

  const st = r.strategy;
  if (st.hookVariants.length < 3) penal(6, `hook variant কম (${st.hookVariants.length}/3)`);
  if (st.imageImprovementTips.length < 3) penal(3, "image improvement tips কম");
  if (L(st.trendAlignment) < 50) penal(3, "trend alignment নেই");
  if (st.viralScore <= 0 || st.viralScore > 100) penal(5, "viral score অবৈধ");

  return { score: Math.max(0, Math.min(100, score)), issues };
}

/* ---------------------------------------------------------
   ENRICHMENT PASS — the "highest effort" second brain call
   Text-only (image already understood) → fast + cheap, but
   rewrites every weak field to publish-ready depth.
--------------------------------------------------------- */

const ENRICH_PROMPT = (draft: string, weak: string[], language?: string, tone?: string) => `You are the senior quality-control editor at ViralLens. Below is a DRAFT social-media blueprint for an image that has already been analysed. Upgrade it into an elite, publish-ready version.

LANGUAGE: ${language || "Bangla / Banglish"} — natural, modern, the way real creators post. Never textbook Bangla.
TONE: ${tone || "Viral & Catchy"}

FIELDS THAT MUST BE SUBSTANTIALLY REWRITTEN (they measured weak):
${weak.map((w) => `- ${w}`).join("\n") || "- none, but still sharpen the weakest 3 fields"}

UPGRADE RULES (do these for every field, even the good ones):
- Make every sentence specific to the image. Delete any generic filler ("beautiful moment", "amazing view").
- facebookOutput.primaryCaption: 500-1100 chars, 4-6 short paragraphs separated by blank lines, emotional arc (hook → context → meaning → payoff), ends with a comment-bait question.
- facebookOutput.hookLine: 5-10 words, must work as a standalone scroll-stopper.
- facebookOutput.viralStrategyTips: exactly 4, each a concrete action with a number or timeframe.
- instagramOutput.mainCaption: 300-1100 chars, airy short lines with blank lines (never "." ladders), ends with save/share CTA.
- instagramOutput.aestheticTips: exactly 3 (crop ratio, audio/format, posting tactic).
- twitterOutput.singleTweet: 90-240 chars, ONE sharp idea, max 1 emoji, max 2 hashtags.
- twitterOutput.threadTweets: exactly 3, each 120-240 chars, numbered "1/3", "2/3", "3/3", escalating value, last one drives bookmark/RT.
- linkedinOutput.professionalCaption: 400-900 chars, insight-led (hook → short story → takeaway → question).
- deepAnalysis.summary: 3 full sentences, min 180 chars, name concrete visual details.
- strategy.hookVariants: exactly 3, three different psychological angles (curiosity gap, emotional, bold statement).
- strategy.imageImprovementTips: exactly 3-4 actionable edits (ratio, exposure, overlay zone, colour).
- Keep hashtags relevant to the image; keep the existing good ones, add better ones if a tier is thin.
- Keep the viralScore honest: only raise it if the content genuinely improved.

OUTPUT: return ONLY the complete upgraded JSON object with the exact same keys and shape as the draft. No markdown, no commentary.

DRAFT JSON:
${draft}`;

async function enrichCall(
  brain: BrainId,
  model: string,
  apiKey: string | undefined,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (brain === "mistral") {
    const key = apiKey?.trim() || process.env.MISTRAL_API_KEY;
    if (!key) throw new ProviderError("mistral", 0, "MISTRAL_API_KEY নেই।");
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: /pixtral/i.test(model) ? "mistral-large-latest" : model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 16384,
      }),
      signal,
    });
    if (!res.ok) throw new ProviderError("mistral", res.status, await readErrorBody(res));
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return (data.choices?.[0]?.message?.content || "").trim();
  }

  const key = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new ProviderError("gemini", 0, "GEMINI_API_KEY নেই।");
  const isThinking = /gemini-(2\.5|3)/i.test(model);
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    temperature: 0.85,
    topP: 0.95,
    maxOutputTokens: isThinking ? 65536 : 16384,
  };
  if (isThinking) generationConfig.thinkingConfig = { thinkingBudget: /flash-lite/i.test(model) ? 1024 : 3072 };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
    signal,
  });
  if (!res.ok) throw new ProviderError("gemini", res.status, await readErrorBody(res));
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  };
  return (data.candidates?.[0]?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || "")
    .join("")
    .trim();
}

export type Effort = "standard" | "deep" | "maximum";

const EFFORT_LABEL: Record<Effort, string> = {
  standard: "Standard (1 vision pass)",
  deep: "Deep (vision + enrich)",
  maximum: "Maximum (vision + enrich + QC retry)",
};

/**
 * Runs the second-pass enrichment and returns the better of draft/enriched.
 * Never makes things worse: if the enriched version scores lower, keep the draft.
 */
async function runEnrichment(args: {
  brain: BrainId;
  model: string;
  apiKey?: string;
  language?: string;
  tone?: string;
  draft: EngineResult;
  fallback: AnalysisResult;
  signal?: AbortSignal;
  passes: string[];
  enrichMs: { value: number };
}): Promise<EngineResult> {
  const report = scoreAnalysisQuality(args.draft.result);
  // Only spend a second call when there is something real to gain
  if (report.score >= 92 || report.issues.length === 0) {
    args.passes.push("enrich skipped — draft already elite");
    return args.draft;
  }

  const weakList = report.issues.slice(0, 8);
  const prompt = ENRICH_PROMPT(JSON.stringify(args.draft.result), weakList, args.language, args.tone);

  try {
    const t0 = Date.now();
    const raw = await enrichCall(args.brain, args.model, args.apiKey, prompt, args.signal);
    args.enrichMs.value = Date.now() - t0;

    const enriched = polishFromText(raw, args.fallback);
    const before = scoreAnalysisQuality(args.draft.result);
    const after = scoreAnalysisQuality(enriched.result);

    if (after.score > before.score) {
      args.passes.push(
        `enrich pass: quality ${before.score} → ${after.score} (+${after.score - before.score}) in ${(args.enrichMs.value / 1000).toFixed(1)}s`
      );
      return {
        result: enriched.result,
        meta: {
          ...enriched.meta,
          completeness: Math.max(enriched.meta.completeness, args.draft.meta.completeness),
          repairs: Array.from(new Set([...args.draft.meta.repairs, ...enriched.meta.repairs])),
        },
      };
    }

    // Keep the better fields from each (enriched base, but only where it scored better overall is ambiguous → prefer draft)
    args.passes.push(`enrich pass tried: ${before.score} → ${after.score} — kept draft`);
    return args.draft;
  } catch (error) {
    args.passes.push(
      `enrich pass failed: ${error instanceof Error ? error.message.slice(0, 120) : "unknown"} — kept draft`
    );
    return args.draft;
  }
}

/* ---------------------------------------------------------
   Pipeline: model chain with retries, deadlines & partials
--------------------------------------------------------- */

export function buildModelChain(brain: BrainId, requested?: string): string[] {
  const defaults = brain === "mistral" ? MISTRAL_CHAIN : GEMINI_CHAIN;
  const chain = requested ? [requested, ...defaults] : defaults;
  return Array.from(new Set(chain.filter(Boolean)));
}

export interface PipelineOptions extends Omit<AnalyzeRequestOptions, "model" | "signal"> {
  model?: string;
  effort?: Effort;
  signal?: AbortSignal;
  deadlineMs?: number;
  perAttemptMs?: number;
}

const ACCEPT_COMPLETENESS = 62;
const PARTIAL_COMPLETENESS = 35;

const QUALITY_TARGET: Record<Effort, number> = { standard: 62, deep: 78, maximum: 88 };

export async function runAnalysisPipeline(opts: PipelineOptions): Promise<PipelineOutcome> {
  const started = Date.now();
  const effort: Effort = opts.effort || "deep";
  const deadlineMs = opts.deadlineMs ?? 110_000;
  const perAttemptMs = opts.perAttemptMs ?? 70_000;
  const chain = buildModelChain(opts.brain, opts.model);
  const fallback = generateSmartDemoAnalysis(opts.userNotes, opts.language, opts.tone, chain[0]);
  const passes: string[] = [];
  const attempts: AttemptInfo[] = [];
  const enrichMs = { value: 0 };
  let best: { engine: EngineResult; model: string } | null = null;
  let accepted: { engine: EngineResult; model: string } | null = null;

  for (const model of chain) {
    const elapsed = Date.now() - started;
    if (elapsed > deadlineMs - 12_000) {
      attempts.push({ model, ok: false, ms: 0, error: "skipped — time budget exhausted" });
      continue;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(perAttemptMs, deadlineMs - elapsed));
    const t0 = Date.now();

    try {
      const request: AnalyzeRequestOptions = { ...opts, model, signal: controller.signal };
      const engine = opts.brain === "mistral" ? await analyzeWithMistral(request) : await analyzeWithGemini(request);
      const ms = Date.now() - t0;
      const quality = scoreAnalysisQuality(engine.result);

      attempts.push({
        model,
        ok: engine.meta.completeness >= ACCEPT_COMPLETENESS,
        ms,
        completeness: engine.meta.completeness,
        error: engine.meta.completeness < ACCEPT_COMPLETENESS ? `অসম্পূর্ণ (${engine.meta.completeness}% ফিল্ড)` : undefined,
      });
      passes.push(`${model}: ${engine.meta.completeness}% fields, quality ${quality.score}/100 in ${(ms / 1000).toFixed(1)}s${quality.issues.length ? ` · ${quality.issues.length} issues` : ""}`);

      if (!best || quality.score > scoreAnalysisQuality(best.engine.result).score) best = { engine, model };

      if (engine.meta.completeness >= ACCEPT_COMPLETENESS && quality.score >= QUALITY_TARGET[effort]) {
        accepted = { engine, model };
        break;
      }

      // A bad key fails identically on every model — stop early instead of burning time.
      if (engine.meta.completeness < ACCEPT_COMPLETENESS) {
        const lastErr = attempts[attempts.length - 1]?.error;
        if (lastErr && /key/i.test(lastErr)) break;
      }
    } catch (error) {
      const message = humanizeProviderError(error, opts.brain);
      attempts.push({ model, ok: false, ms: Date.now() - t0, error: message });
      console.warn(`[pipeline] ${opts.brain}/${model} failed:`, message);

      const status = error instanceof ProviderError ? error.status : -1;
      if (status === 0 || status === 401 || status === 403 || status === 422 || /api key|block/i.test(message)) break;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---- no usable model output at all → local fallback ---- */
  if (!best) {
    const firstError = attempts.find((a) => a.error && !a.error.startsWith("skipped"))?.error;
    passes.push(`local fallback used: ${firstError || "no model output"}`);
    return {
      result: { ...fallback, strategy: { ...fallback.strategy, qcScore: scoreAnalysisQuality(fallback).score } },
      meta: { completeness: 0, repairs: [], passes },
      modelUsed: `local-fallback (${chain[0]})`,
      attempts,
      isFallback: true,
      isPartial: false,
      fallbackReason: firstError || "AI service did not return a usable response.",
      latencyMs: Date.now() - started,
      quality: scoreAnalysisQuality(fallback),
      effort,
    };
  }

  /* ---- second pass: elite enrichment (deep / maximum) ---- */
  let engine = best.engine;
  let modelUsed = best.model;

  if (effort !== "standard" && !opts.signal?.aborted) {
    const remaining = deadlineMs - (Date.now() - started);
    if (remaining > 15_000) {
      engine = await runEnrichment({
        brain: opts.brain,
        model: modelUsed,
        apiKey: opts.apiKey,
        language: opts.language,
        tone: opts.tone,
        draft: best.engine,
        fallback,
        passes,
        enrichMs,
      });
    } else {
      passes.push(`enrich skipped — only ${Math.round(remaining / 1000)}s left in budget`);
    }
  }

  /* ---- maximum effort: one more vision retry if still below target ---- */
  const finalQuality = scoreAnalysisQuality(engine.result);
  if (effort === "maximum" && finalQuality.score < QUALITY_TARGET.maximum) {
    const elapsed = Date.now() - started;
    const nextModel = chain.find((m) => m !== modelUsed);
    if (nextModel && deadlineMs - elapsed > 25_000) {
      passes.push(`QC below target (${finalQuality.score}) → retrying vision pass with ${nextModel}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(perAttemptMs, deadlineMs - (Date.now() - started)));
      try {
        const retry = await (opts.brain === "mistral"
          ? analyzeWithMistral({ ...opts, model: nextModel, signal: controller.signal, variation: (opts.variation || 1) + 1 })
          : analyzeWithGemini({ ...opts, model: nextModel, signal: controller.signal, variation: (opts.variation || 1) + 1 }));
        const retryQuality = scoreAnalysisQuality(retry.result);
        passes.push(`retry ${nextModel}: quality ${retryQuality.score}/100`);
        if (retryQuality.score > finalQuality.score) {
          engine = retry;
          modelUsed = nextModel;
        }
      } catch (error) {
        passes.push(`retry failed: ${humanizeProviderError(error, opts.brain).slice(0, 100)}`);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const report = scoreAnalysisQuality(engine.result);
  const completeness = Math.max(engine.meta.completeness, report.score);

  return {
    result: { ...engine.result, strategy: { ...engine.result.strategy, qcScore: report.score } },
    meta: {
      ...engine.meta,
      completeness,
      passes,
      qualityIssues: report.issues,
      enrichMs: enrichMs.value || undefined,
    },
    modelUsed,
    attempts,
    isFallback: false,
    isPartial: engine.meta.completeness < ACCEPT_COMPLETENESS,
    fallbackReason: null,
    latencyMs: Date.now() - started,
    quality: report,
    effort,
  };
}

/* =========================================================
   ViralLens — shared domain types (safe to import anywhere)
   ========================================================= */

export type BrainId = "gemini" | "mistral";

export interface DeepAnalysis {
  summary: string;
  subjects: string[];
  vibeAndMood: string;
  colorPalette: string[];
  lightingAndSetting: string;
  storytellingAngle: string;
  emotionalHook: string;
  targetAudience: string;
  /* v3 additions — optional so older stored rows still type-check */
  compositionNotes?: string;
  textInImage?: string;
  culturalContext?: string;
  thumbStopFactor?: string;
}

export interface FacebookOutput {
  hookLine: string;
  primaryCaption: string;
  shortPunchyCaption: string;
  hashtags: string[];
  viralStrategyTips: string[];
  callToAction: string;
  firstComment?: string;
}

export interface TwitterOutput {
  singleTweet: string;
  threadTweets: string[];
  hashtags: string[];
  quoteBaitPrompt: string;
  viralStrategyTips: string[];
  altText?: string;
}

export interface InstagramOutput {
  mainCaption: string;
  minimalCaption: string;
  reelsHook: string;
  tieredHashtags: {
    highReach: string[];
    midNiche: string[];
    community: string[];
  };
  aestheticTips: string[];
  carouselIdea?: string;
  altText?: string;
}

export interface LinkedinOutput {
  professionalCaption: string;
  keyTakeaway: string;
  hashtags: string[];
}

export interface StrategyOutput {
  viralScore: number;
  scoreBreakdown: {
    visualImpact: number;
    emotionalPull: number;
    shareability: number;
    trendFit: number;
  };
  verdict: string;
  bestPostingTimes: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  recommendedFormat: string;
  hookVariants: string[];
  imageImprovementTips: string[];
  trendAlignment: string;
  contentPillars: string[];
  firstCommentStrategy: string;
  /** QC score computed by ViralLens itself (0-100) */
  qcScore?: number;
}

export interface AnalysisResult {
  deepAnalysis: DeepAnalysis;
  facebookOutput: FacebookOutput;
  twitterOutput: TwitterOutput;
  instagramOutput: InstagramOutput;
  linkedinOutput: LinkedinOutput;
  strategy: StrategyOutput;
}

export interface QualityReport {
  score: number;
  issues: string[];
}

export interface QualityMeta {
  /** % of expected fields that the model itself authored (rest were auto-filled) */
  completeness: number;
  /** Human readable list of automatic fixes applied to the raw model output */
  repairs: string[];
  finishReason?: string;
  truncated?: boolean;
  /** Per-stage log: vision pass, enrich pass, QC retry */
  passes?: string[];
  /** Fields the QC scorer flagged as weak (with measured reasons) */
  qualityIssues?: string[];
  /** ms spent in the enrichment pass */
  enrichMs?: number;
}

export interface EngineResult {
  result: AnalysisResult;
  meta: QualityMeta;
}

export interface AttemptInfo {
  model: string;
  ok: boolean;
  ms: number;
  error?: string;
  completeness?: number;
}

export interface PipelineOutcome {
  result: AnalysisResult;
  meta: QualityMeta;
  modelUsed: string;
  attempts: AttemptInfo[];
  isFallback: boolean;
  isPartial: boolean;
  fallbackReason: string | null;
  latencyMs: number;
  quality: QualityReport;
  effort: Effort;
}

export type Effort = "standard" | "deep" | "maximum";

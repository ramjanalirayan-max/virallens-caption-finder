import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageTitle: text("image_title").notNull(),
  imageThumbnail: text("image_thumbnail"), // base64 or URL thumbnail
  brainUsed: text("brain_used").notNull(), // 'gemini-2.5-flash', 'pixtral-12b', etc.
  language: text("language").notNull().default("Bangla / Banglish"),
  tone: text("tone").notNull().default("Viral & Engaging"),
  objective: text("objective").notNull().default("Max Reach & Engagement"),
  
  // Deep visual breakdown
  deepAnalysis: jsonb("deep_analysis").$type<{
    summary: string;
    subjects: string[];
    vibeAndMood: string;
    colorPalette: string[];
    lightingAndSetting: string;
    storytellingAngle: string;
    emotionalHook: string;
    targetAudience: string;
  }>().notNull(),

  // Facebook Suite
  facebookOutput: jsonb("facebook_output").$type<{
    hookLine: string;
    primaryCaption: string;
    shortPunchyCaption: string;
    hashtags: string[];
    viralStrategyTips: string[];
    callToAction: string;
  }>().notNull(),

  // Twitter / X Suite
  twitterOutput: jsonb("twitter_output").$type<{
    singleTweet: string;
    threadTweets: string[];
    hashtags: string[];
    quoteBaitPrompt: string;
    viralStrategyTips: string[];
  }>().notNull(),

  // Instagram Suite
  instagramOutput: jsonb("instagram_output").$type<{
    mainCaption: string;
    minimalCaption: string;
    reelsHook: string;
    tieredHashtags: {
      highReach: string[];
      midNiche: string[];
      community: string[];
    };
    aestheticTips: string[];
  }>().notNull(),

  // LinkedIn Suite
  linkedinOutput: jsonb("linkedin_output").$type<{
    professionalCaption: string;
    keyTakeaway: string;
    hashtags: string[];
  }>(),

  // Advanced intelligence block
  insights: jsonb("insights").$type<{
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
  }>(),

  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalysisRecord = typeof analyses.$inferSelect;
export type NewAnalysisRecord = typeof analyses.$inferInsert;

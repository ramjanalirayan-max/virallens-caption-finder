import { pgTable, serial, text, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import type {
  DeepAnalysis,
  FacebookOutput,
  TwitterOutput,
  InstagramOutput,
  LinkedinOutput,
  StrategyOutput,
  QualityMeta,
} from "@/lib/types";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageTitle: text("image_title").notNull(),
  imageThumbnail: text("image_thumbnail"), // small base64 JPEG thumbnail
  brainUsed: text("brain_used").notNull(), // 'gemini (gemini-2.5-flash)', 'local-fallback', ...
  modelUsed: text("model_used"),
  language: text("language").notNull().default("Bangla / Banglish"),
  tone: text("tone").notNull().default("Viral & Engaging"),
  objective: text("objective").notNull().default("Max Reach & Engagement"),

  // Deep visual breakdown
  deepAnalysis: jsonb("deep_analysis").$type<DeepAnalysis>().notNull(),

  // Platform suites
  facebookOutput: jsonb("facebook_output").$type<FacebookOutput>().notNull(),
  twitterOutput: jsonb("twitter_output").$type<TwitterOutput>().notNull(),
  instagramOutput: jsonb("instagram_output").$type<InstagramOutput>().notNull(),
  linkedinOutput: jsonb("linkedin_output").$type<LinkedinOutput>(),

  // v3: strategy + quality
  strategyOutput: jsonb("strategy_output").$type<StrategyOutput>(),
  qualityMeta: jsonb("quality_meta").$type<QualityMeta>(),
  viralScore: integer("viral_score"),

  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalysisRecord = typeof analyses.$inferSelect;
export type NewAnalysisRecord = typeof analyses.$inferInsert;

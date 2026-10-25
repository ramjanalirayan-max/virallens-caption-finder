"use client";

import React, { useMemo, useState } from "react";
import { X, Star, Trash2, RefreshCw, Search, Clock, Image as ImageIcon } from "lucide-react";
import type { AnalysisResult, QualityMeta, StrategyOutput } from "@/lib/types";
import { Chip, Kicker, scoreTone, timeAgo, GeminiIcon, MistralIcon } from "./Shared";

export interface HistoryItem {
  id: number;
  imageTitle: string;
  imageThumbnail: string | null;
  brainUsed: string;
  modelUsed?: string | null;
  language: string;
  tone: string;
  deepAnalysis: AnalysisResult["deepAnalysis"];
  facebookOutput: AnalysisResult["facebookOutput"];
  twitterOutput: AnalysisResult["twitterOutput"];
  instagramOutput: AnalysisResult["instagramOutput"];
  linkedinOutput?: AnalysisResult["linkedinOutput"] | null;
  strategyOutput?: StrategyOutput | null;
  qualityMeta?: QualityMeta | null;
  viralScore?: number | null;
  isFavorite: boolean;
  createdAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  isLoading: boolean;
  onSelect: (item: HistoryItem) => void;
  onToggleFavorite: (id: number, currentFav: boolean) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  items,
  isLoading,
  onSelect,
  onToggleFavorite,
  onDelete,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "favorites" && !i.isFavorite) return false;
      if (!q) return true;
      return (
        i.imageTitle.toLowerCase().includes(q) ||
        i.brainUsed.toLowerCase().includes(q) ||
        (i.deepAnalysis?.summary || "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="toast-in flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-ink-700 px-5 py-4">
          <div>
            <Kicker className="text-violet">Archive</Kicker>
            <h3 className="font-display text-lg font-bold text-white">পূর্বের বিশ্লেষণসমূহ</h3>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-ink-600 p-2 text-ink-300 transition hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-ink-600 p-2 text-ink-300 transition hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 px-5 py-3">
          <div className="flex items-center rounded-lg border border-ink-700 bg-ink-850 p-0.5">
            {(["all", "favorites"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                  filter === f ? "bg-ink-600 text-white" : "text-ink-300 hover:text-white"
                }`}
              >
                {f === "all" ? `সব (${items.length})` : `ফেভারিট (${items.filter((i) => i.isFavorite).length})`}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="খুঁজুন…" className="field !py-2 !pl-8 !text-[12px]" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Clock className="h-8 w-8 text-ink-500" />
              <p className="text-[13px] font-semibold text-ink-200">{isLoading ? "লোড হচ্ছে…" : "কিছু পাওয়া যায়নি"}</p>
              <p className="text-[12px] text-ink-400">বিশ্লেষণ করলে এখানে স্বয়ংক্রিয়ভাবে সেভ হবে।</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((item) => {
                const score = item.viralScore ?? item.strategyOutput?.viralScore ?? null;
                const tone = score != null ? scoreTone(score) : null;
                const isMistral = /mistral|pixtral/i.test(item.brainUsed);
                const isLocal = /local|fallback/i.test(item.brainUsed);
                return (
                  <div
                    key={item.id}
                    className="group flex cursor-pointer gap-3 rounded-xl border border-ink-700 bg-ink-850/70 p-3 transition hover:border-lime/40"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-800">
                      {item.imageThumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageThumbnail} alt={item.imageTitle} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-500">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-bold text-white" title={item.imageTitle}>
                          {item.imageTitle}
                        </p>
                        {score != null && tone ? (
                          <span className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ color: tone.color, background: `${tone.color}1a` }}>
                            {score}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-ink-300">{item.deepAnalysis?.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Chip tone={isLocal ? "amber" : isMistral ? "amber" : "lime"} className="!py-0 font-mono !text-[9.5px]">
                          {isLocal ? "local" : isMistral ? <MistralIcon className="h-3 w-3" /> : <GeminiIcon className="h-3 w-3" />}
                          {(item.modelUsed || item.brainUsed).replace(/^(gemini|mistral)\s*\(/, "").replace(/\)$/, "").slice(0, 28)}
                        </Chip>
                        <span className="font-mono text-[10px] text-ink-400">{timeAgo(item.createdAt)}</span>
                        <span className="ml-auto flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(item.id, item.isFavorite);
                            }}
                            className={`rounded-md p-1 transition hover:text-amber ${item.isFavorite ? "text-amber" : "text-ink-400"}`}
                            title="Favorite"
                          >
                            <Star className={`h-3.5 w-3.5 ${item.isFavorite ? "fill-amber" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                            className="rounded-md p-1 text-ink-400 transition hover:text-coral"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

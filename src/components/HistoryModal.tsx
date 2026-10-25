"use client";

import React, { useState } from "react";
import { X, Star, Trash2, Calendar, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { AnalysisResult } from "@/lib/ai-brains";

export interface HistoryItem {
  id: number;
  imageTitle: string;
  imageThumbnail: string | null;
  brainUsed: string;
  language: string;
  tone: string;
  deepAnalysis: AnalysisResult["deepAnalysis"];
  facebookOutput: AnalysisResult["facebookOutput"];
  twitterOutput: AnalysisResult["twitterOutput"];
  instagramOutput: AnalysisResult["instagramOutput"];
  linkedinOutput?: AnalysisResult["linkedinOutput"];
  insights?: AnalysisResult["insights"];
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
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (filterFavorites && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.imageTitle.toLowerCase().includes(q);
      const hookMatch = item.facebookOutput?.hookLine?.toLowerCase().includes(q);
      const summaryMatch = item.deepAnalysis?.summary?.toLowerCase().includes(q);
      return titleMatch || hookMatch || summaryMatch;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-lime-500/10 text-lime-400 border border-lime-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">পূর্বের বিশ্লেষণ ইতিহাস</h3>
              <p className="text-xs text-slate-400">PostgreSQL ডাটাবেসে সেভ করা ক্যাপশন ও স্ট্র্যাটেজি</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ক্যাপশন বা টপিক খুঁজুন..."
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-lime-500 text-xs text-slate-200 placeholder-slate-500 outline-none"
          />

          <button
            type="button"
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition ${
              filterFavorites
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>ফেভারিট শুধু ({items.filter((i) => i.isFavorite).length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              লোড হচ্ছে...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              কোনো ইতিহাস পাওয়া যায়নি। ছবি বিশ্লেষণ করলে স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে!
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-lime-500/40 transition group flex items-start gap-4"
              >
                {/* Thumbnail if available */}
                {item.imageThumbnail ? (
                  <img
                    src={item.imageThumbnail}
                    alt={item.imageTitle}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 text-xs">
                    ছবি
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-200 truncate pr-2">
                      {item.imageTitle || "Untitled Analysis"}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3 inline" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-lime-400 mt-1 line-clamp-1 font-medium">
                    &ldquo;{item.facebookOutput?.hookLine || item.deepAnalysis?.summary}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {item.brainUsed}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {item.language}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {item.tone}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 shrink-0 self-center">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id, item.isFavorite)}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                    title={item.isFavorite ? "ফেভারিট থেকে সরান" : "ফেভারিট করুন"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.isFavorite ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-lime-600/20 hover:bg-lime-600/40 text-lime-300 border border-lime-500/30 text-xs font-medium transition"
                  >
                    ভিউ করুন
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

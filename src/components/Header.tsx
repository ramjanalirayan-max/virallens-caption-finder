"use client";

import React from "react";
import { Settings, History } from "lucide-react";
import { LogoMark, GeminiIcon, MistralIcon } from "./Shared";
import type { BrainId } from "@/lib/types";

interface HeaderProps {
  currentBrain: BrainId;
  currentModel: string;
  onBrainChange: (brain: BrainId, model?: string) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount?: number;
  hasCustomGeminiKey: boolean;
  hasCustomMistralKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentBrain,
  currentModel,
  onBrainChange,
  onOpenSettings,
  onOpenHistory,
  historyCount = 0,
  hasCustomGeminiKey,
  hasCustomMistralKey,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* brand */}
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark className="h-9 w-9 text-white" />
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-2">
              <span className="font-display text-[19px] font-extrabold tracking-tight text-white">ViralLens</span>
              <span className="hidden rounded-md border border-lime/30 bg-lime/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-lime sm:inline">
                v3 · multi-brain
              </span>
            </div>
            <p className="mt-1 hidden truncate text-[11.5px] text-ink-300 md:block">
              ছবি → গভীর বিশ্লেষণ → Facebook · X · Instagram · LinkedIn ভাইরাল ব্লুপ্রিন্ট
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* brain switch */}
          <div className="hidden items-center rounded-xl border border-ink-700 bg-ink-900/80 p-1 sm:flex">
            <button
              type="button"
              onClick={() => onBrainChange("gemini")}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                currentBrain === "gemini" ? "bg-ink-600 text-white shadow" : "text-ink-300 hover:text-white"
              }`}
              title="Google Gemini vision brain"
            >
              <GeminiIcon className="h-3.5 w-3.5 text-lime" />
              Gemini
              <span className={`h-1.5 w-1.5 rounded-full ${hasCustomGeminiKey ? "bg-mint" : "bg-ink-400"}`} />
            </button>
            <button
              type="button"
              onClick={() => onBrainChange("mistral")}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                currentBrain === "mistral" ? "bg-ink-600 text-white shadow" : "text-ink-300 hover:text-white"
              }`}
              title="Mistral Pixtral vision brain"
            >
              <MistralIcon className="h-3.5 w-3.5 text-amber" />
              Mistral
              <span className={`h-1.5 w-1.5 rounded-full ${hasCustomMistralKey ? "bg-mint" : "bg-ink-400"}`} />
            </button>
          </div>

          <span className="hidden rounded-lg border border-ink-700 bg-ink-900/80 px-2.5 py-2 font-mono text-[10.5px] text-ink-300 lg:inline" title="Active model">
            {currentModel}
          </span>

          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900/80 px-3 py-2 text-[12px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white"
            title="Past analyses"
          >
            <History className="h-4 w-4 text-violet" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 ? (
              <span className="rounded-md bg-violet/20 px-1.5 py-0.5 font-mono text-[10px] text-violet">{historyCount}</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="relative flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900/80 px-3 py-2 text-[12px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white"
            title="API keys & brains"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Brains</span>
            {hasCustomGeminiKey || hasCustomMistralKey ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-ink-950" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
};

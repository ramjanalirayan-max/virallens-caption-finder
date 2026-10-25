"use client";

import React from "react";
import { Settings, History, Cpu, Zap, Flame, Sparkles, Wind } from "lucide-react";
import { BRAINS, type BrainId } from "@/lib/brain-config";

interface HeaderProps {
  currentBrain: BrainId;
  currentModel: string;
  onBrainChange: (brain: BrainId, model: string) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount?: number;
  configuredBrains: BrainId[];
}

const BRAIN_ICONS: Record<BrainId, React.ReactNode> = {
  gemini: <Cpu className="w-3.5 h-3.5" />,
  mistral: <Zap className="w-3.5 h-3.5" />,
  groq: <Flame className="w-3.5 h-3.5" />,
  openrouter: <Sparkles className="w-3.5 h-3.5" />,
  huggingface: <Wind className="w-3.5 h-3.5" />,
};

const BrandMark = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="vl-ring" x1="6" y1="6" x2="42" y2="42">
        <stop offset="0%" stopColor="#C6F24E" />
        <stop offset="55%" stopColor="#5BC0F2" />
        <stop offset="100%" stopColor="#FF7A5B" />
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#0F1720" stroke="url(#vl-ring)" strokeWidth="2" />
    <circle cx="24" cy="24" r="12.5" fill="none" stroke="url(#vl-ring)" strokeWidth="2.4" />
    <path d="M24 11.5 L31.2 18.2 L24 24 Z" fill="#C6F24E" opacity="0.9" />
    <path d="M34.8 21 L30.4 30 L24 24 Z" fill="#5BC0F2" opacity="0.85" />
    <path d="M27.6 36 L18.6 34.6 L24 24 Z" fill="#FF7A5B" opacity="0.85" />
    <path d="M12.6 27 L16.4 18.4 L24 24 Z" fill="#F4F6F2" opacity="0.7" />
    <circle cx="24" cy="24" r="3.1" fill="#080D14" stroke="#C6F24E" strokeWidth="1.6" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  currentBrain,
  onBrainChange,
  onOpenSettings,
  onOpenHistory,
  historyCount = 0,
  configuredBrains,
}) => {
  const active = BRAINS.find((b) => b.id === currentBrain) || BRAINS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080d14]/85 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-3 group shrink-0">
          <BrandMark />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-white">
                ViralLens<span className="text-[#C6F24E]">.ai</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full font-mono-label text-[8px] text-[#C6F24E] border border-[#C6F24E]/30 bg-[#C6F24E]/8">
                5-Brain v2.2
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-white/45">
              ছবির গভীর বিশ্লেষণ → ভাইরাল পোস্ট আর্কিটেকচার
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2">
          {/* Brain switcher – 5 providers */}
          <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-[#0F1720] max-w-[52vw] sm:max-w-none overflow-x-auto no-scrollbar">
            {BRAINS.map((brain) => {
              const isActive = currentBrain === brain.id;
              const configured = configuredBrains.includes(brain.id);
              return (
                <button
                  key={brain.id}
                  type="button"
                  onClick={() => onBrainChange(brain.id, "auto")}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? brain.accent : "transparent",
                    color: isActive ? "#0B121B" : "rgba(255,255,255,0.58)",
                  }}
                  title={`${brain.name} — ${brain.meta}`}
                >
                  {BRAIN_ICONS[brain.id]}
                  <span className="hidden md:inline">{brain.short}</span>
                  {configured && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isActive ? "rgba(11,18,27,0.55)" : "#34d399",
                      }}
                      title="Key configured"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-[#0F1720] text-white/70 hover:text-white hover:border-white/25 text-[11px] font-semibold transition"
            title="পূর্বের স্ক্যান"
          >
            <History className="w-3.5 h-3.5 text-[#5BC0F2]" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="min-w-[17px] h-[17px] px-1 grid place-items-center rounded-full bg-[#5BC0F2] text-[#0B121B] text-[9px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-[#0F1720] text-white/70 hover:text-white hover:border-white/25 text-[11px] font-semibold transition"
            title="API কী ও সেটিংস"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Settings</span>
            {configuredBrains.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#080d14]" />
            )}
          </button>
        </div>
      </div>

      {/* active brain strip */}
      <div className="border-t border-white/5 bg-[#0B121B]/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center gap-2 text-[9px] font-mono-label text-white/35">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active.accent }} />
          <span style={{ color: active.accent }}>{active.name}</span>
          <span>· {active.meta}</span>
          <span className="hidden sm:inline">· {active.freeNote}</span>
        </div>
      </div>
    </header>
  );
};

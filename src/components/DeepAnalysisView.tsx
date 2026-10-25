"use client";

import React, { useState } from "react";
import { Eye, Palette, Lightbulb, Heart, Compass, Check, ScanSearch } from "lucide-react";
import type { AnalysisResult } from "@/lib/ai-brains";

interface DeepAnalysisViewProps {
  data: AnalysisResult["deepAnalysis"];
  brainUsed: string;
}

export const DeepAnalysisView: React.FC<DeepAnalysisViewProps> = ({ data, brainUsed }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  if (!data) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B121B]/85 overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl border border-[#5BC0F2]/30 bg-[#5BC0F2]/10 text-[#5BC0F2] grid place-items-center">
            <ScanSearch className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Deep Vision Breakdown
              <span className="font-mono-label text-[8px] px-2 py-0.5 rounded-full bg-white/5 text-white/55 border border-white/10">
                {brainUsed}
              </span>
            </h3>
            <p className="text-[11px] text-white/50">
              ছবির উপাদান, আলো, রঙ এবং আবেগীয় স্তরের গভীর বিশ্লেষণ
            </p>
          </div>
        </div>

        {/* Palette chips */}
        {data.colorPalette?.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-[#0F1720]">
            <Palette className="w-3.5 h-3.5 text-white/45" />
            {data.colorPalette.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopyColor(color)}
                className="relative w-6 h-6 rounded-lg border border-white/20 transition-transform hover:scale-110 active:scale-95 grid place-items-center"
                style={{ backgroundColor: color }}
                title={`কপি করুন: ${color}`}
              >
                {copiedColor === color && (
                  <Check className="w-3.5 h-3.5 text-[#0B121B] bg-white rounded" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Summary strip */}
        <div className="relative p-4 rounded-2xl border border-[#C6F24E]/20 bg-gradient-to-r from-[#C6F24E]/[0.07] to-transparent">
          <div className="font-mono-label text-[9px] text-[#C6F24E] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Visual Summary
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">{data.summary}</p>
        </div>

        {/* 4 analysis tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
            <div className="font-mono-label text-[9px] text-[#5BC0F2] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Detected Subjects
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.subjects?.map((sub, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#5BC0F2]/10 text-[#9DD6F7] border border-[#5BC0F2]/20"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
            <div className="font-mono-label text-[9px] text-[#FF7A5B] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Vibe &amp; Mood
            </div>
            <p className="text-xs text-white/75 leading-relaxed">{data.vibeAndMood}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
            <div className="font-mono-label text-[9px] text-[#C6F24E] flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Lighting &amp; Composition
            </div>
            <p className="text-xs text-white/75 leading-relaxed">{data.lightingAndSetting}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
            <div className="font-mono-label text-[9px] text-[#F4F6F2] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              Emotional Hook
            </div>
            <p className="text-xs text-white/75 leading-relaxed">{data.emotionalHook}</p>
          </div>
        </div>

        {/* Storytelling angle + audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-[#0F1720]">
            <div className="font-mono-label text-[9px] text-white/50">Storytelling Angle</div>
            <p className="text-xs text-white/80 leading-relaxed mt-2">{data.storytellingAngle}</p>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-[#0F1720]">
            <div className="font-mono-label text-[9px] text-white/50">Target Audience</div>
            <p className="text-xs text-white/80 leading-relaxed mt-2">{data.targetAudience}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

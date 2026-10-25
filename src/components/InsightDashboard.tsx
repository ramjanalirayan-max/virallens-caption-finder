"use client";

import React, { useEffect, useState } from "react";
import {
  Gauge,
  Share2,
  Bookmark,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  LayoutGrid,
  Users,
  ShieldAlert,
  Target,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/ai-brains";

type Insights = AnalysisResult["insights"];

interface InsightDashboardProps {
  insights: Insights;
  brainUsed: string;
}

function ScoreRing({
  value,
  label,
  accent,
  icon,
  delay = 0,
}: {
  value: number;
  label: string;
  accent: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = window.setTimeout(() => {
      const duration = 900;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);

    return () => window.clearTimeout(start);
  }, [value, delay]);

  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative p-4 rounded-2xl bg-[#0F1720] border border-white/10 flex items-center gap-3 overflow-hidden group">
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] opacity-70"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={accent}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * display) / 100}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black tabular-nums" style={{ color: accent }}>
            {display}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50">
          <span style={{ color: accent }}>{icon}</span>
          <span>{label}</span>
        </div>
        <p className="text-[11px] text-white/45 mt-1 leading-snug">
          {display >= 80
            ? "শক্তিশালী সম্ভাবনা"
            : display >= 60
              ? "ভালো সম্ভাবনা"
              : "টেস্ট করে দেখুন"}
        </p>
      </div>
    </div>
  );
}

export const InsightDashboard: React.FC<InsightDashboardProps> = ({ insights, brainUsed }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!insights) return null;

  const copy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1600);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B121B]/85 overflow-hidden">
      {/* Header band */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#C6F24E]/10 via-transparent to-transparent">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#C6F24E]" />
            Performance Intelligence
          </h3>
          <p className="text-[11px] text-white/50 mt-1">
            ভাইরাল পটেনশিয়াল, সময়, ট্রেন্ড ও কনটেন্ট কৌশল — সব এক জায়গায়
            <span className="text-white/35 font-mono"> · engine: {brainUsed}</span>
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#C6F24E] text-[#0B121B] text-[10px] font-black uppercase tracking-[0.18em]">
          Live Scorecard
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Verdict */}
        <div className="p-4 rounded-2xl border border-[#C6F24E]/25 bg-[#C6F24E]/[0.06]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6F24E]">
            <Zap className="w-3.5 h-3.5" />
            Virality Verdict
          </div>
          <p className="mt-2 text-sm text-white/90 leading-relaxed">{insights.viralityVerdict}</p>
        </div>

        {/* Score rings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ScoreRing
            value={insights.engagementScore}
            label="Engagement"
            accent="#C6F24E"
            icon={<Zap className="w-3 h-3" />}
            delay={80}
          />
          <ScoreRing
            value={insights.shareabilityScore}
            label="Shareability"
            accent="#FF7A5B"
            icon={<Share2 className="w-3 h-3" />}
            delay={180}
          />
          <ScoreRing
            value={insights.saveWorthinessScore}
            label="Save Worth"
            accent="#5BC0F2"
            icon={<Bookmark className="w-3 h-3" />}
            delay={280}
          />
        </div>

        {/* A/B hooks */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            <Target className="w-3.5 h-3.5 text-[#C6F24E]" />
            A/B Test Hook Variants — প্রতিটি আলাদা দিনে টেস্ট করুন
          </div>
          <div className="grid gap-2">
            {(insights.abHookVariants || []).map((hook, index) => (
              <button
                key={index}
                type="button"
                onClick={() => copy(hook, index)}
                className="w-full text-left px-4 py-3 rounded-xl bg-[#0F1720] border border-white/10 hover:border-[#C6F24E]/45 hover:bg-[#121C27] transition group"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-white/55">
                    Variant {String.fromCharCode(65 + index)}
                  </span>
                  <p className="text-xs text-white/85 leading-relaxed flex-1">{hook}</p>
                  <span className="text-[10px] text-white/35 group-hover:text-[#C6F24E] transition">
                    {copiedIndex === index ? "✓ Copied" : "Copy"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Two-column: timing + trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best time */}
          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              <Clock className="w-3.5 h-3.5 text-[#5BC0F2]" />
              Best Time To Post
            </div>
            <ul className="space-y-2">
              {(insights.bestTimeToPost || []).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-white/75 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#5BC0F2] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trend tags + SEO */}
          <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF7A5B]" />
              Trend Tags + Search Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(insights.trendTags || []).map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => copy(tag, 100 + index)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FF7A5B]/10 text-[#FFA48B] border border-[#FF7A5B]/25 hover:bg-[#FF7A5B]/20 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(insights.seoKeywords || []).map((keyword, index) => (
                <span
                  key={index}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-white/50 border border-white/10"
                >
                  🔍 {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Storyboard + pillars + pain points */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Carousel storyboard */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              <LayoutGrid className="w-3.5 h-3.5 text-[#C6F24E]" />
              Carousel / Slide Storyboard
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(insights.carouselStoryboard || []).map((slide, index) => (
                <div
                  key={index}
                  className="min-w-[150px] flex-1 p-3 rounded-xl bg-[#141F2B] border border-white/8 relative group hover:border-[#C6F24E]/35 transition"
                >
                  <div className="text-[10px] font-mono text-[#C6F24E]">0{index + 1}</div>
                  <p className="text-[11px] text-white/75 leading-relaxed mt-1.5">{slide}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars + pain points + risk */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <Sparkles className="w-3.5 h-3.5 text-[#C6F24E]" />
                Content Pillars
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(insights.contentPillars || []).map((pillar, index) => (
                  <span
                    key={index}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-[#C6F24E]/10 text-[#DCF77A] border border-[#C6F24E]/25"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1720] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <Users className="w-3.5 h-3.5 text-[#5BC0F2]" />
                Audience Pain Points
              </div>
              <ul className="space-y-1.5">
                {(insights.audiencePainPoints || []).map((point, index) => (
                  <li key={index} className="text-[11px] text-white/70 leading-relaxed flex items-start gap-1.5">
                    <span className="text-[#5BC0F2]">→</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {insights.riskNotes && (
              <div className="p-3.5 rounded-2xl bg-[#FF7A5B]/[0.08] border border-[#FF7A5B]/25 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFA48B]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Risk Notes
                </div>
                <p className="text-[11px] text-white/75 leading-relaxed">{insights.riskNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

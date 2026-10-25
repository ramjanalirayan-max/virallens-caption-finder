"use client";

import React, { useEffect, useState } from "react";
import { Clock, Layers, TrendingUp, Wrench, MessageSquareText, Sparkles } from "lucide-react";
import type { StrategyOutput } from "@/lib/types";
import { Chip, Kicker, FacebookIcon, XIcon, InstagramIcon, scoreTone } from "./Shared";

function Gauge({ score }: { score: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setValue(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const r = 58;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const progress = arc - (value / 100) * arc;
  const { color, label } = scoreTone(score);

  return (
    <div className="relative h-[168px] w-[168px] shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full" style={{ transform: "rotate(135deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-ink-700)" strokeWidth="11" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          className="gauge-arc"
          style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="font-display text-[44px] font-extrabold leading-none tracking-tight text-white">{score}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">viral score</span>
      </div>
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold"
        style={{ color, borderColor: `${color}55`, background: `${color}14` }}
      >
        {label}
      </div>
    </div>
  );
}

function Bar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const { color } = scoreTone(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11.5px]">
        <span className="font-semibold text-ink-200">{label}</span>
        <span className="font-mono text-ink-300">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className="bar-grow h-full rounded-full" style={{ width: `${value}%`, background: color, animationDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

export function ViralScoreCard({
  strategy,
  onUseHook,
}: {
  strategy: StrategyOutput;
  onUseHook?: (hook: string) => void;
}) {
  const sb = strategy.scoreBreakdown;
  return (
    <section className="panel rise overflow-hidden">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center lg:justify-start">
          <Gauge score={strategy.viralScore} />
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <Kicker className="mb-1.5 text-lime">Verdict</Kicker>
            <p className="text-balance font-display text-lg font-bold leading-snug text-white sm:text-xl">{strategy.verdict}</p>
          </div>

          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Bar label="Visual impact" value={sb.visualImpact} delay={100} />
            <Bar label="Emotional pull" value={sb.emotionalPull} delay={220} />
            <Bar label="Shareability" value={sb.shareability} delay={340} />
            <Bar label="Trend fit" value={sb.trendFit} delay={460} />
          </div>

          {strategy.contentPillars?.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Kicker className="mr-1">Pillars</Kicker>
              {strategy.contentPillars.map((p) => (
                <Chip key={p} tone="violet">
                  {p}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-px border-t border-ink-700 bg-ink-700 lg:grid-cols-3">
        {/* posting times */}
        <div className="space-y-3 bg-ink-850/90 p-5">
          <div className="flex items-center gap-2 text-ink-200">
            <Clock className="h-4 w-4 text-lime" />
            <Kicker>Best time to post</Kicker>
          </div>
          <ul className="space-y-2 text-[12.5px]">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-fb/20 text-[#8cbcff]">
                <FacebookIcon className="h-3 w-3" />
              </span>
              <span className="text-ink-200">{strategy.bestPostingTimes.facebook}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ink-100/10 text-ink-100">
                <XIcon className="h-3 w-3" />
              </span>
              <span className="text-ink-200">{strategy.bestPostingTimes.twitter}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ig/20 text-[#ff8ab3]">
                <InstagramIcon className="h-3 w-3" />
              </span>
              <span className="text-ink-200">{strategy.bestPostingTimes.instagram}</span>
            </li>
          </ul>
        </div>

        {/* format + trend */}
        <div className="space-y-3 bg-ink-850/90 p-5">
          <div className="flex items-center gap-2 text-ink-200">
            <Layers className="h-4 w-4 text-cyan" />
            <Kicker>Format & trend</Kicker>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-100">
            <span className="font-semibold text-cyan">Format:</span> {strategy.recommendedFormat}
          </p>
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-200">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
            {strategy.trendAlignment}
          </p>
        </div>

        {/* improvement tips */}
        <div className="space-y-3 bg-ink-850/90 p-5">
          <div className="flex items-center gap-2 text-ink-200">
            <Wrench className="h-4 w-4 text-amber" />
            <Kicker>Fix before posting</Kicker>
          </div>
          <ul className="space-y-1.5">
            {strategy.imageImprovementTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-200">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(strategy.hookVariants?.length || strategy.firstCommentStrategy) && (
        <div className="grid gap-px border-t border-ink-700 bg-ink-700 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2.5 bg-ink-850/90 p-5">
            <div className="flex items-center gap-2 text-ink-200">
              <Sparkles className="h-4 w-4 text-lime" />
              <Kicker>Hook variants — A/B test</Kicker>
            </div>
            <div className="space-y-2">
              {strategy.hookVariants.map((hook, i) => (
                <div key={i} className="group flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-lime/15 font-mono text-[10px] font-bold text-lime">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <p className="flex-1 text-[13px] leading-relaxed text-ink-100">{hook}</p>
                  {onUseHook ? (
                    <button
                      type="button"
                      onClick={() => onUseHook(hook)}
                      className="shrink-0 rounded-md border border-ink-600 px-2 py-1 font-mono text-[10px] font-semibold text-ink-300 opacity-70 transition hover:border-lime/50 hover:text-lime group-hover:opacity-100"
                    >
                      USE
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2.5 bg-ink-850/90 p-5">
            <div className="flex items-center gap-2 text-ink-200">
              <MessageSquareText className="h-4 w-4 text-mint" />
              <Kicker>First-comment play</Kicker>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-200">{strategy.firstCommentStrategy}</p>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import React from "react";
import { Eye, Compass, Lightbulb, Heart, Users, ScanText, Globe2, Crop, Zap, BookOpen } from "lucide-react";
import type { DeepAnalysis } from "@/lib/types";
import { Chip, Kicker, copyText } from "./Shared";

interface DeepAnalysisViewProps {
  data: DeepAnalysis;
  brainLabel: string;
  onNotify?: (msg: string) => void;
}

function Fact({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value?: string; accent: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${accent}1f`, color: accent }}>
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{label}</span>
      </div>
      <p className="text-[12.5px] leading-relaxed text-ink-100">{value}</p>
    </div>
  );
}

export const DeepAnalysisView: React.FC<DeepAnalysisViewProps> = ({ data, brainLabel, onNotify }) => {
  if (!data) return null;

  return (
    <section className="panel rise overflow-hidden" style={{ animationDelay: "80ms" }}>
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-700 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet/30 bg-violet/10 text-violet">
          <Eye className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <Kicker className="text-violet">Section 01</Kicker>
          <h3 className="font-display text-base font-bold text-white">গভীর ভিশন বিশ্লেষণ</h3>
        </div>
        <Chip tone="neutral" className="ml-auto font-mono">
          {brainLabel}
        </Chip>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-balance text-[14.5px] leading-relaxed text-ink-100">{data.summary}</p>

        {/* palette film strip */}
        {data.colorPalette?.length ? (
          <div>
            <Kicker className="mb-2">Colour story — click to copy</Kicker>
            <div className="flex gap-1.5 overflow-hidden rounded-xl border border-ink-700">
              {data.colorPalette.map((hex, i) => (
                <button
                  key={`${hex}-${i}`}
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(hex);
                    onNotify?.(ok ? `${hex} কপি হয়েছে ✓` : "কপি করা যায়নি");
                  }}
                  className="group relative h-16 flex-1 transition-all hover:flex-[1.6]"
                  style={{ background: hex }}
                  title={hex}
                >
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    {hex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* subjects */}
        {data.subjects?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Kicker className="mr-1">Detected</Kicker>
            {data.subjects.map((s, i) => (
              <Chip key={`${s}-${i}`} tone="cyan">
                {s}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Fact icon={<Compass className="h-3.5 w-3.5" />} label="Vibe & mood" value={data.vibeAndMood} accent="#ff8ab3" />
          <Fact icon={<Lightbulb className="h-3.5 w-3.5" />} label="Light & setting" value={data.lightingAndSetting} accent="#ffc34d" />
          <Fact icon={<Crop className="h-3.5 w-3.5" />} label="Composition" value={data.compositionNotes} accent="#5ad8e6" />
          <Fact icon={<Zap className="h-3.5 w-3.5" />} label="Thumb-stop factor" value={data.thumbStopFactor} accent="#c6f135" />
          <Fact icon={<ScanText className="h-3.5 w-3.5" />} label="Text in image" value={data.textInImage} accent="#bfbccf" />
          <Fact icon={<Globe2 className="h-3.5 w-3.5" />} label="Cultural context" value={data.culturalContext} accent="#4fd1a5" />
          <Fact icon={<Heart className="h-3.5 w-3.5" />} label="Emotional hook" value={data.emotionalHook} accent="#ff6b5c" />
          <Fact icon={<Users className="h-3.5 w-3.5" />} label="Target audience" value={data.targetAudience} accent="#8b7cff" />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-lime/20 bg-lime/5 p-4">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
          <div>
            <Kicker className="mb-1 text-lime">Storytelling angle</Kicker>
            <p className="text-[13px] leading-relaxed text-ink-100">{data.storytellingAngle}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

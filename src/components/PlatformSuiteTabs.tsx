"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Flame, Layers, Wand2, Sparkles, MessageSquareQuote, Eye, EyeOff, ListChecks, Accessibility, GalleryHorizontalEnd } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { PostPreview, type PreviewPlatform } from "./PostPreview";
import { Chip, CopyButton, HashtagCloud, Kicker, FacebookIcon, XIcon, InstagramIcon, LinkedinIcon } from "./Shared";

export interface PlatformSuiteHandle {
  applyHook: (hook: string) => void;
}

interface PlatformSuiteTabsProps {
  result: AnalysisResult;
  imageSrc?: string | null;
  onRefineCaption?: (platform: string, currentText: string, instruction: string) => Promise<string | void>;
  onNotify?: (msg: string) => void;
}

type Tab = PreviewPlatform;

const TAB_META: Record<
  Tab,
  { label: string; sub: string; icon: React.ReactNode; accent: string; refineName: string }
> = {
  facebook: { label: "Facebook", sub: "ভাইরাল পোস্ট", icon: <FacebookIcon className="h-4 w-4" />, accent: "#1877f2", refineName: "Facebook" },
  twitter: { label: "X (Twitter)", sub: "থ্রেড", icon: <XIcon className="h-3.5 w-3.5" />, accent: "#e7e9ea", refineName: "Twitter" },
  instagram: { label: "Instagram", sub: "অ্যাস্থেটিক", icon: <InstagramIcon className="h-4 w-4" />, accent: "#e1306c", refineName: "Instagram" },
  linkedin: { label: "LinkedIn", sub: "প্রফেশনাল", icon: <LinkedinIcon className="h-3.5 w-3.5" />, accent: "#0a66c2", refineName: "LinkedIn" },
};

const QUICK_REFINES = [
  "আরেকটু ছোট করো",
  "আরো emotional করো",
  "আরো ইমোজি দাও",
  "শেষে একটা প্রশ্ন দাও",
  "বেশি বাংলা স্ল্যাং দাও",
  "Make it English",
];

const len = (s: string) => Array.from(s || "").length;

function InfoCard({
  icon,
  label,
  text,
  accent,
  onNotify,
}: {
  icon: React.ReactNode;
  label: string;
  text?: string;
  accent: string;
  onNotify?: (msg: string) => void;
}) {
  if (!text) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-ink-700 bg-ink-900/50 p-3.5">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-1.5" style={{ color: accent }}>
          {icon}
          <span className="text-[10.5px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-100">{text}</p>
      </div>
      <CopyButton text={text} size="xs" onCopied={onNotify} />
    </div>
  );
}

function Editor({
  value,
  onChange,
  accent,
  rows = 8,
  limit,
}: {
  value: string;
  onChange: (v: string) => void;
  accent: string;
  rows?: number;
  limit?: number;
}) {
  const count = len(value);
  const over = limit ? count > limit : false;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="field resize-y !rounded-xl !p-4 !text-[13.5px] leading-relaxed"
        style={{ borderColor: over ? "var(--color-coral)" : undefined }}
      />
      <span
        className={`pointer-events-none absolute bottom-2.5 right-3 rounded-md bg-ink-900/90 px-1.5 py-0.5 font-mono text-[10px] ${
          over ? "text-coral" : "text-ink-300"
        }`}
        style={{ borderBottom: `2px solid ${over ? "var(--color-coral)" : accent}` }}
      >
        {count}
        {limit ? ` / ${limit}` : " chars"}
      </span>
    </div>
  );
}

function Tips({ tips, accent }: { tips?: string[]; accent: string }) {
  if (!tips?.length) return null;
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
      <div className="mb-2 flex items-center gap-2" style={{ color: accent }}>
        <ListChecks className="h-4 w-4" />
        <Kicker className="!text-inherit">Playbook — এটা করলে reach বাড়বে</Kicker>
      </div>
      <ul className="space-y-1.5">
        {tips.map((t, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-200">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PlatformSuiteTabs = forwardRef<PlatformSuiteHandle, PlatformSuiteTabsProps>(function PlatformSuiteTabs(
  { result, imageSrc, onRefineCaption, onNotify },
  ref
) {
  const [tab, setTab] = useState<Tab>("facebook");
  const [drafts, setDrafts] = useState({
    facebook: result.facebookOutput.primaryCaption,
    twitter: result.twitterOutput.singleTweet,
    instagram: result.instagramOutput.mainCaption,
    linkedin: result.linkedinOutput.professionalCaption,
  });
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [showTags, setShowTags] = useState(true);

  useEffect(() => {
    setDrafts({
      facebook: result.facebookOutput.primaryCaption,
      twitter: result.twitterOutput.singleTweet,
      instagram: result.instagramOutput.mainCaption,
      linkedin: result.linkedinOutput.professionalCaption,
    });
  }, [result]);

  const setDraft = (key: Tab, value: string) => setDrafts((d) => ({ ...d, [key]: value }));

  useImperativeHandle(ref, () => ({
    applyHook(hook: string) {
      setDrafts((d) => {
        const current = d[tab] || "";
        if (tab === "twitter") return { ...d, twitter: hook };
        const lines = current.split("\n");
        lines[0] = hook;
        return { ...d, [tab]: lines.join("\n") };
      });
      onNotify?.(`Hook "${hook.slice(0, 28)}…" ${TAB_META[tab].label} caption-এ বসানো হয়েছে`);
    },
  }));

  const runRefine = async (instruction: string) => {
    const text = instruction.trim();
    if (!text || !onRefineCaption || isRefining) return;
    setIsRefining(true);
    try {
      const revised = await onRefineCaption(TAB_META[tab].refineName, drafts[tab], text);
      if (typeof revised === "string" && revised.trim()) {
        setDraft(tab, revised.trim());
        onNotify?.("AI রিফাইন সম্পন্ন ✓");
      }
      setRefineInput("");
    } finally {
      setIsRefining(false);
    }
  };

  const fb = result.facebookOutput;
  const tw = result.twitterOutput;
  const ig = result.instagramOutput;
  const li = result.linkedinOutput;
  const meta = TAB_META[tab];

  const igAllTags = [...ig.tieredHashtags.highReach, ...ig.tieredHashtags.midNiche, ...ig.tieredHashtags.community];
  const previewTags = showTags
    ? tab === "facebook"
      ? fb.hashtags
      : tab === "twitter"
        ? tw.hashtags
        : tab === "instagram"
          ? igAllTags
          : li.hashtags
    : [];

  const tabStats: Record<Tab, string> = {
    facebook: `${fb.hashtags.length} tags`,
    twitter: `${len(drafts.twitter)}/280`,
    instagram: `${igAllTags.length} tags`,
    linkedin: `${li.hashtags.length} tags`,
  };

  return (
    <section className="panel rise overflow-hidden" style={{ animationDelay: "160ms" }}>
      {/* tabs */}
      <nav className="no-scrollbar flex overflow-x-auto border-b border-ink-700 bg-ink-900/40">
        {(Object.keys(TAB_META) as Tab[]).map((key) => {
          const m = TAB_META[key];
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative flex min-w-[150px] flex-1 items-center justify-center gap-2 px-4 py-3.5 text-[13px] font-semibold transition ${
                active ? "text-white" : "text-ink-300 hover:text-ink-100"
              }`}
            >
              <span style={{ color: active ? m.accent : undefined }}>{m.icon}</span>
              <span>{m.label}</span>
              <span className="rounded-md border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">{tabStats[key]}</span>
              {active ? <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full" style={{ background: m.accent }} /> : null}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ================= EDITOR ================= */}
        <div className="min-w-0 space-y-5">
          {/* ---------- FACEBOOK ---------- */}
          {tab === "facebook" && (
            <>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-fb/30 bg-gradient-to-r from-fb/15 to-transparent p-4">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[#8cbcff]">
                    <Flame className="h-4 w-4 text-coral" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Scroll-stopping hook</span>
                  </div>
                  <p className="font-display text-[15px] font-bold leading-snug text-white">“{fb.hookLine}”</p>
                </div>
                <CopyButton text={fb.hookLine} size="xs" onCopied={onNotify} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Kicker>মূল ভাইরাল পোস্ট — edit করতে পারেন</Kicker>
                  <CopyButton text={drafts.facebook} label="পোস্ট কপি" variant="lime" onCopied={onNotify} />
                </div>
                <Editor value={drafts.facebook} onChange={(v) => setDraft("facebook", v)} accent={meta.accent} rows={9} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard icon={<Sparkles className="h-3.5 w-3.5" />} label="Short & punchy (Story)" text={fb.shortPunchyCaption} accent="#8cbcff" onNotify={onNotify} />
                <InfoCard icon={<MessageSquareQuote className="h-3.5 w-3.5" />} label="Comment-bait CTA" text={fb.callToAction} accent="#8cbcff" onNotify={onNotify} />
              </div>
              <InfoCard icon={<MessageSquareQuote className="h-3.5 w-3.5" />} label="আপনার first comment" text={fb.firstComment} accent="#4fd1a5" onNotify={onNotify} />

              <HashtagCloud tags={fb.hashtags} tone="fb" label="Facebook hashtags" onCopied={onNotify} />
              <Tips tips={fb.viralStrategyTips} accent="#8cbcff" />
            </>
          )}

          {/* ---------- X ---------- */}
          {tab === "twitter" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Kicker>The tweet — ≤ 280 chars</Kicker>
                  <CopyButton text={drafts.twitter} label="টুইট কপি" variant="lime" onCopied={onNotify} />
                </div>
                <Editor value={drafts.twitter} onChange={(v) => setDraft("twitter", v)} accent="#e7e9ea" rows={4} limit={280} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-ink-200">
                    <Layers className="h-4 w-4" />
                    <Kicker>3-tweet thread — ready to post</Kicker>
                  </div>
                  <CopyButton text={tw.threadTweets.join("\n\n")} label="পুরো থ্রেড" size="xs" onCopied={onNotify} />
                </div>
                <div className="relative space-y-2 pl-5">
                  <span className="absolute bottom-4 left-[7px] top-4 w-px bg-ink-600" />
                  {tw.threadTweets.map((t, i) => (
                    <div key={i} className="relative rounded-xl border border-ink-700 bg-ink-900/50 p-3.5">
                      <span className="absolute -left-5 top-4 h-3 w-3 rounded-full border-2 border-ink-900 bg-ink-100" />
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-ink-300">
                          {i + 1}/{tw.threadTweets.length} · {len(t)} chars
                        </span>
                        <CopyButton text={t} size="xs" onCopied={onNotify} />
                      </div>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-100">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard icon={<MessageSquareQuote className="h-3.5 w-3.5" />} label="Quote-tweet bait" text={tw.quoteBaitPrompt} accent="#e7e9ea" onNotify={onNotify} />
                <InfoCard icon={<Accessibility className="h-3.5 w-3.5" />} label="Alt text (reach boost)" text={tw.altText} accent="#5ad8e6" onNotify={onNotify} />
              </div>
              <HashtagCloud tags={tw.hashtags} tone="x" label="X hashtags — restraint wins" onCopied={onNotify} />
              <Tips tips={tw.viralStrategyTips} accent="#e7e9ea" />
            </>
          )}

          {/* ---------- INSTAGRAM ---------- */}
          {tab === "instagram" && (
            <>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-ig/30 bg-gradient-to-r from-ig/15 to-transparent p-4">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[#ff8ab3]">
                    <Flame className="h-4 w-4 text-coral" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Reel cover / carousel overlay</span>
                  </div>
                  <p className="font-display text-[15px] font-bold leading-snug text-white">“{ig.reelsHook}”</p>
                </div>
                <CopyButton text={ig.reelsHook} size="xs" onCopied={onNotify} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Kicker>Feed caption — edit করতে পারেন</Kicker>
                  <div className="flex items-center gap-2">
                    <CopyButton text={`${drafts.instagram}\n\n${igAllTags.join(" ")}`} label="caption + tags" size="sm" onCopied={onNotify} />
                    <CopyButton text={drafts.instagram} label="ক্যাপশন কপি" variant="lime" onCopied={onNotify} />
                  </div>
                </div>
                <Editor value={drafts.instagram} onChange={(v) => setDraft("instagram", v)} accent={meta.accent} rows={9} limit={2200} />
              </div>

              <InfoCard icon={<Sparkles className="h-3.5 w-3.5" />} label="Minimal one-liner" text={ig.minimalCaption} accent="#ff8ab3" onNotify={onNotify} />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Kicker>3-tier hashtag stack ({igAllTags.length})</Kicker>
                  <CopyButton text={igAllTags.join(" ")} label="সব ট্যাগ কপি" size="xs" onCopied={onNotify} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "High reach · 1M+", tags: ig.tieredHashtags.highReach, tone: "ig" as const },
                    { title: "Mid niche · 100k–800k", tags: ig.tieredHashtags.midNiche, tone: "violet" as const },
                    { title: "Community · <100k", tags: ig.tieredHashtags.community, tone: "cyan" as const },
                  ].map((tier) => (
                    <div key={tier.title} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
                      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-300">{tier.title}</p>
                      <HashtagCloud tags={tier.tags} tone={tier.tone} onCopied={onNotify} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard icon={<GalleryHorizontalEnd className="h-3.5 w-3.5" />} label="Carousel idea" text={ig.carouselIdea} accent="#ff8ab3" onNotify={onNotify} />
                <InfoCard icon={<Accessibility className="h-3.5 w-3.5" />} label="Alt text" text={ig.altText} accent="#5ad8e6" onNotify={onNotify} />
              </div>
              <Tips tips={ig.aestheticTips} accent="#ff8ab3" />
            </>
          )}

          {/* ---------- LINKEDIN ---------- */}
          {tab === "linkedin" && (
            <>
              <InfoCard icon={<Sparkles className="h-3.5 w-3.5" />} label="Key takeaway" text={li.keyTakeaway} accent="#7fb6ff" onNotify={onNotify} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Kicker>Professional post — edit করতে পারেন</Kicker>
                  <CopyButton text={drafts.linkedin} label="পোস্ট কপি" variant="lime" onCopied={onNotify} />
                </div>
                <Editor value={drafts.linkedin} onChange={(v) => setDraft("linkedin", v)} accent={meta.accent} rows={8} limit={3000} />
              </div>
              <HashtagCloud tags={li.hashtags} tone="li" label="LinkedIn hashtags" onCopied={onNotify} />
            </>
          )}

          {/* ---------- REFINE BAR ---------- */}
          {onRefineCaption && (
            <div className="space-y-2.5 border-t border-ink-700 pt-4">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REFINES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isRefining}
                    onClick={() => runRefine(q)}
                    className="rounded-lg border border-ink-600 bg-ink-800/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-200 transition hover:border-lime/40 hover:text-lime disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Wand2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lime" />
                  <input
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runRefine(refineInput);
                      }
                    }}
                    placeholder={`${meta.label} caption AI দিয়ে রিফাইন করুন — নিজের instruction লিখুন…`}
                    className="field !pl-9"
                  />
                </div>
                <button
                  type="button"
                  disabled={isRefining || !refineInput.trim()}
                  onClick={() => runRefine(refineInput)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-[12.5px] font-bold text-lime-ink transition hover:bg-[#d4f85c] active:scale-95 disabled:opacity-40"
                >
                  <Sparkles className={`h-4 w-4 ${isRefining ? "animate-spin" : ""}`} />
                  {isRefining ? "রিফাইন হচ্ছে…" : "AI রিফাইন"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= LIVE PREVIEW ================= */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-lime" />
              <Kicker>Live preview · {meta.label}</Kicker>
            </div>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-2 py-1 font-mono text-[10px] font-semibold text-ink-300 transition hover:text-white"
            >
              {showTags ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              hashtags
            </button>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-3">
            <PostPreview platform={tab} caption={drafts[tab]} hashtags={previewTags} imageSrc={imageSrc} />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-ink-400">
            caption edit করলে preview সাথে সাথে বদলাবে
          </p>
        </aside>
      </div>
    </section>
  );
});

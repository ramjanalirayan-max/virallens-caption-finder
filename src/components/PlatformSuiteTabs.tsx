"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Layers,
  Wand2,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AnalysisResult } from "@/lib/ai-brains";

// Custom SVG platform icons
const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XTwitterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

interface PlatformSuiteTabsProps {
  facebook: AnalysisResult["facebookOutput"];
  twitter: AnalysisResult["twitterOutput"];
  instagram: AnalysisResult["instagramOutput"];
  linkedin?: AnalysisResult["linkedinOutput"];
  onRefineCaption?: (platform: string, currentText: string, instruction: string) => Promise<string | void>;
}

export const PlatformSuiteTabs: React.FC<PlatformSuiteTabsProps> = ({
  facebook,
  twitter,
  instagram,
  linkedin,
  onRefineCaption,
}) => {
  const [activeTab, setActiveTab] = useState<"facebook" | "twitter" | "instagram" | "linkedin">("facebook");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Local state for editable/refined text
  const [fbCaption, setFbCaption] = useState(facebook?.primaryCaption || "");
  const [fbShort, setFbShort] = useState(facebook?.shortPunchyCaption || "");
  const [twTweet, setTwTweet] = useState(twitter?.singleTweet || "");
  const [igCaption, setIgCaption] = useState(instagram?.mainCaption || "");

  // Update if props change
  React.useEffect(() => {
    if (facebook?.primaryCaption) setFbCaption(facebook.primaryCaption);
    if (facebook?.shortPunchyCaption) setFbShort(facebook.shortPunchyCaption);
    if (twitter?.singleTweet) setTwTweet(twitter.singleTweet);
    if (instagram?.mainCaption) setIgCaption(instagram.mainCaption);
  }, [facebook, twitter, instagram]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    triggerConfetti();
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleRefine = async (platform: string, currentText: string) => {
    if (!refineInput.trim() || !onRefineCaption) return;
    setIsRefining(true);
    try {
      const result = await onRefineCaption(platform, currentText, refineInput.trim());
      if (typeof result === "string" && result) {
        if (platform === "Facebook") setFbCaption(result);
        if (platform === "Twitter") setTwTweet(result);
        if (platform === "Instagram") setIgCaption(result);
      }
      setRefineInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="bg-[#0B121B] border border-white/10 rounded-3xl overflow-hidden">
      {/* Platform Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[#0F1720]/70 overflow-x-auto no-scrollbar">
        {/* Facebook Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("facebook")}
          className={`flex-1 min-w-[130px] py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
            activeTab === "facebook"
              ? "border-blue-500 text-blue-400 bg-blue-500/10"
              : "border-transparent text-white/55 hover:text-white/90 hover:bg-[#0B121B]/50"
          }`}
        >
          <FacebookIcon className="w-4 h-4 text-blue-500" />
          <span>Facebook</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
            ভাইরাল
          </span>
        </button>

        {/* X / Twitter Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("twitter")}
          className={`flex-1 min-w-[130px] py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
            activeTab === "twitter"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-white/55 hover:text-white/90 hover:bg-[#0B121B]/50"
          }`}
        >
          <XTwitterIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>X (Twitter)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono">
            থ্রেড
          </span>
        </button>

        {/* Instagram Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("instagram")}
          className={`flex-1 min-w-[130px] py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
            activeTab === "instagram"
              ? "border-pink-500 text-pink-400 bg-pink-500/10"
              : "border-transparent text-white/55 hover:text-white/90 hover:bg-[#0B121B]/50"
          }`}
        >
          <InstagramIcon className="w-4 h-4 text-pink-500" />
          <span>Instagram</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-mono">
            অ্যাস্থেটিক
          </span>
        </button>

        {/* LinkedIn Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("linkedin")}
          className={`flex-1 min-w-[130px] py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
            activeTab === "linkedin"
              ? "border-blue-600 text-blue-300 bg-blue-600/10"
              : "border-transparent text-white/55 hover:text-white/90 hover:bg-[#0B121B]/50"
          }`}
        >
          <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>LinkedIn</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-mono">
            প্রফেশনাল
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* ======================= FACEBOOK TAB ======================= */}
        {activeTab === "facebook" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Hook Line Highlight */}
            {facebook.hookLine && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-800/40 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400 inline mr-1" />
                    <span>Viral First-Line Hook (স্ক্রল থামানোর প্রথম বাক্য):</span>
                  </span>
                  <p className="text-sm font-semibold text-white mt-1">
                    &ldquo;{facebook.hookLine}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(facebook.hookLine, "fb-hook")}
                  className="p-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 text-xs font-medium border border-blue-800/50 shrink-0 transition"
                  title="কপি হুক"
                >
                  {copiedKey === "fb-hook" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Primary Viral Facebook Post */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>মূল ভাইরাল ফেসবুক পোস্ট (Full Storytelling &amp; CTA)</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fbCaption, "fb-main")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
                >
                  {copiedKey === "fb-main" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={fbCaption}
                onChange={(e) => setFbCaption(e.target.value)}
                rows={7}
                className="w-full p-4 rounded-xl bg-[#0F1720] border border-white/10 focus:border-blue-500 text-xs sm:text-sm text-white/90 leading-relaxed font-sans resize-y outline-none"
              />
            </div>

            {/* Short Punchy Alternative */}
            {facebook.shortPunchyCaption && (
              <div className="p-3.5 rounded-xl bg-[#0F1720]/60 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                    ছোট ও পাঞ্চি অপশন (Facebook Story / Quick Share):
                  </span>
                  <p className="text-xs text-white/90 mt-0.5">{facebook.shortPunchyCaption}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(facebook.shortPunchyCaption, "fb-short")}
                  className="p-2 rounded-lg bg-[#0B121B] hover:bg-white/10 text-white/75 border border-white/15 shrink-0"
                >
                  {copiedKey === "fb-short" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Facebook Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Facebook Viral &amp; Trending হ্যাশট্যাগ ({facebook.hashtags?.length || 0})</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(facebook.hashtags?.join(" ") || "", "fb-hashtags")}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  {copiedKey === "fb-hashtags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>সব ট্যাগ কপি</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#0F1720] border border-white/10">
                {facebook.hashtags?.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => copyToClipboard(tag, `fb-tag-${idx}`)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Strategy Checklist */}
            {facebook.viralStrategyTips && facebook.viralStrategyTips.length > 0 && (
              <div className="p-4 rounded-xl bg-[#0F1720]/80 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white/75 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Facebook অ্যালগরিদম হ্যাক ও পোস্টিং কৌশল:</span>
                </span>
                <ul className="space-y-1.5">
                  {facebook.viralStrategyTips.map((tip, i) => (
                    <li key={i} className="text-xs text-white/55 flex items-start space-x-2">
                      <span className="text-blue-400 font-bold">&bull;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ======================= X (TWITTER) TAB ======================= */}
        {activeTab === "twitter" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Single Punchy Tweet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Punchy Viral Tweet (&lt; 280 Chars)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      twTweet.length > 280 ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    {twTweet.length} / 280
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(twTweet, "tw-single")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md shadow-sky-500/20 transition"
                >
                  {copiedKey === "tw-single" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>টুইট কপি</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={twTweet}
                onChange={(e) => setTwTweet(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-[#0F1720] border border-white/10 focus:border-sky-400 text-xs sm:text-sm text-white/90 leading-relaxed font-sans resize-y outline-none"
              />
            </div>

            {/* 3-Tweet Mini Viral Thread */}
            {twitter.threadTweets && twitter.threadTweets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>3-Tweet Mini Thread (Ready-to-Post)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(twitter.threadTweets?.join("\n\n---\n\n") || "", "tw-thread")}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                  >
                    {copiedKey === "tw-thread" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>পুরো থ্রেড কপি</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {twitter.threadTweets.map((tweet, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0F1720] border border-white/10 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tweet, `tw-thread-${idx}`)}
                          className="opacity-60 group-hover:opacity-100 p-1 text-white/55 hover:text-white"
                        >
                          {copiedKey === `tw-thread-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/90 mt-1.5 leading-relaxed">{tweet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quote Bait Prompt */}
            {twitter.quoteBaitPrompt && (
              <div className="p-3.5 rounded-xl bg-[#0F1720]/60 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                    Quote Tweet Bait (বেশি রিটুইট পাওয়ার প্রশ্ন):
                  </span>
                  <p className="text-xs text-sky-300 mt-0.5 font-medium">&ldquo;{twitter.quoteBaitPrompt}&rdquo;</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(twitter.quoteBaitPrompt, "tw-quote")}
                  className="p-2 rounded-lg bg-[#0B121B] hover:bg-white/10 text-white/75 border border-white/15 shrink-0"
                >
                  {copiedKey === "tw-quote" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Hashtags */}
            <div className="flex flex-wrap gap-1.5">
              {twitter.hashtags?.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyToClipboard(tag, `tw-tag-${idx}`)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================= INSTAGRAM TAB ======================= */}
        {activeTab === "instagram" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Reels / Carousel Hook */}
            {instagram.reelsHook && (
              <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-900/40 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                    Reels / Carousel Text Overlay Hook:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-pink-200 mt-0.5">
                    &ldquo;{instagram.reelsHook}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(instagram.reelsHook, "ig-hook")}
                  className="p-2 rounded-lg bg-pink-950 hover:bg-pink-900 text-pink-300 text-xs border border-pink-800/60 shrink-0"
                >
                  {copiedKey === "ig-hook" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Aesthetic Main Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Aesthetic Instagram Feed Caption</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(igCaption, "ig-main")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-pink-600/25 transition"
                >
                  {copiedKey === "ig-main" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>ক্যাপশন কপি</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={igCaption}
                onChange={(e) => setIgCaption(e.target.value)}
                rows={6}
                className="w-full p-4 rounded-xl bg-[#0F1720] border border-white/10 focus:border-pink-500 text-xs sm:text-sm text-white/90 leading-relaxed font-sans resize-y outline-none"
              />
            </div>

            {/* Minimalist 1-liner */}
            {instagram.minimalCaption && (
              <div className="p-3 rounded-xl bg-[#0F1720]/60 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                    Minimalist 1-Liner (ক্লিন ও নান্দনিক):
                  </span>
                  <p className="text-xs text-white/90 mt-0.5">{instagram.minimalCaption}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(instagram.minimalCaption, "ig-min")}
                  className="p-1.5 rounded-lg bg-[#0B121B] text-white/55 hover:text-white"
                >
                  {copiedKey === "ig-min" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* 3-Tiered Instagram Hashtags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                  <span>3-Tiered Hashtag Cloud (High-Reach + Niche + Community)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allTags = [
                      ...(instagram.tieredHashtags?.highReach || []),
                      ...(instagram.tieredHashtags?.midNiche || []),
                      ...(instagram.tieredHashtags?.community || []),
                    ].join(" ");
                    copyToClipboard(allTags, "ig-all-tags");
                  }}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center space-x-1"
                >
                  {copiedKey === "ig-all-tags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>সব ট্যাগ কপি</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tier 1: High Reach */}
                <div className="p-3 rounded-xl bg-[#0F1720] border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-pink-400 uppercase">
                    High Volume (1M+)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {instagram.tieredHashtags?.highReach?.map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tier 2: Mid Niche */}
                <div className="p-3 rounded-xl bg-[#0F1720] border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">
                    Mid Niche (100k-500k)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {instagram.tieredHashtags?.midNiche?.map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tier 3: Community */}
                <div className="p-3 rounded-xl bg-[#0F1720] border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">
                    Hyper-Targeted Community
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {instagram.tieredHashtags?.community?.map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= LINKEDIN TAB ======================= */}
        {activeTab === "linkedin" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {linkedin?.keyTakeaway && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/40 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Core Actionable Takeaway:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-blue-200 mt-0.5">
                    {linkedin.keyTakeaway}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(linkedin.keyTakeaway, "li-takeaway")}
                  className="p-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-700/50 shrink-0"
                >
                  {copiedKey === "li-takeaway" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/75 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>LinkedIn Professional &amp; Thought Leadership Caption</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(linkedin?.professionalCaption || "", "li-main")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-700/25 transition"
                >
                  {copiedKey === "li-main" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>পোস্ট কপি</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={linkedin?.professionalCaption || ""}
                readOnly
                rows={6}
                className="w-full p-4 rounded-xl bg-[#0F1720] border border-white/10 text-xs sm:text-sm text-white/90 leading-relaxed font-sans resize-y outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {linkedin?.hashtags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ======================= AI Quick Refinement Bar ======================= */}
        {onRefineCaption && (
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full relative">
              <input
                type="text"
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder={`AI দিয়ে রিফাইন করুন (যেমন: "আরো বাংলা স্ল্যাং যোগ করো", "আরো ইমোজি দাও", "আরেকটু ছোট করো")...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0F1720] border border-white/10 focus:border-indigo-500 text-xs text-white/90 placeholder-white/30 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const currentText =
                      activeTab === "facebook" ? fbCaption : activeTab === "twitter" ? twTweet : igCaption;
                    handleRefine(
                      activeTab === "facebook" ? "Facebook" : activeTab === "twitter" ? "Twitter" : "Instagram",
                      currentText
                    );
                  }
                }}
              />
              <Wand2 className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="button"
              disabled={isRefining || !refineInput.trim()}
              onClick={() => {
                const currentText =
                  activeTab === "facebook" ? fbCaption : activeTab === "twitter" ? twTweet : igCaption;
                handleRefine(
                  activeTab === "facebook" ? "Facebook" : activeTab === "twitter" ? "Twitter" : "Instagram",
                  currentText
                );
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRefining ? "animate-spin" : ""}`} />
              <span>{isRefining ? "রিফাইন হচ্ছে..." : "AI রিফাইন"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Sparkles,
  RefreshCw,
  Star,
  Copy,
  ChevronDown,
  Trash2,
  AlertTriangle,
  X,
  Info,
  Zap,
  ArrowLeftRight,
  Timer,
  ShieldCheck,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { HistoryModal, type HistoryItem } from "@/components/HistoryModal";
import { DeepAnalysisView } from "@/components/DeepAnalysisView";
import { ViralScoreCard } from "@/components/ViralScoreCard";
import { PlatformSuiteTabs, type PlatformSuiteHandle } from "@/components/PlatformSuiteTabs";
import { Chip, Kicker, GeminiIcon, MistralIcon, FacebookIcon, XIcon, InstagramIcon, LinkedinIcon, copyText } from "@/components/Shared";
import { SAMPLE_IMAGES, type SampleImage } from "@/lib/sample-data";
import type { AnalysisResult, AttemptInfo, BrainId, QualityMeta } from "@/lib/types";
import { generateSmartDemoAnalysis, ensureStrategy } from "@/lib/demo-analysis";
import type { Effort } from "@/lib/ai-brains";
import { type PreparedImage, prepareImageFromFile, prepareImageFromSrc, prepareImageFromUrl } from "@/lib/image-utils";

/* ---------------------------------------------------------- */

const MODEL_OPTIONS: Record<BrainId, Array<{ id: string; name: string; badge: string }>> = {
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Recommended · thinking + vision" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", badge: "Deepest reasoning (slower)" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", badge: "Fastest · highest rate limits" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", badge: "Stable fallback" },
  ],
  mistral: [
    { id: "pixtral-12b-2409", name: "Pixtral 12B", badge: "Open multimodal vision" },
    { id: "pixtral-large-latest", name: "Pixtral Large", badge: "Flagship vision" },
    { id: "mistral-small-latest", name: "Mistral Small", badge: "Fast · low cost" },
    { id: "mistral-medium-latest", name: "Mistral Medium", badge: "Balanced multimodal" },
  ],
};

const TONES = [
  { id: "Viral & Catchy 🔥", label: "ভাইরাল ও আকর্ষণীয় 🔥" },
  { id: "Storyteller & Aesthetic 🌿", label: "গল্প ও নান্দনিক 🌿" },
  { id: "Emotional & Heartfelt ❤️", label: "আবেগঘন ও স্মৃতিকাতর ❤️" },
  { id: "Funny & Meme 🎭", label: "মজার ও মিম স্টাইল 🎭" },
  { id: "Professional & Inspiring 💼", label: "প্রফেশনাল ও অনুপ্রেরণামূলক 💼" },
];

const LANGUAGES = [
  { id: "Bangla / Banglish", label: "বাংলা / বাংলিশ (ট্রেন্ডিং ও স্বাভাবিক)" },
  { id: "Pure Bangla", label: "শুদ্ধ বাংলা (প্রমিত)" },
  { id: "English", label: "English (viral & punchy)" },
  { id: "Mixed", label: "Bangla–English mix" },
];

const OBJECTIVES = [
  { id: "Max Reach & Engagement", label: "সর্বোচ্চ reach ও engagement" },
  { id: "Saves & Shares", label: "Save ও share বাড়ানো" },
  { id: "Comments & Conversation", label: "কমেন্ট ও conversation" },
  { id: "Brand / Product Awareness", label: "Brand / product awareness" },
  { id: "Personal Branding", label: "Personal branding" },
];

const EFFORTS: Array<{ id: Effort; label: string; hint: string }> = [
  { id: "standard", label: "Standard", hint: "১ vision pass — দ্রুত" },
  { id: "deep", label: "Deep", hint: "vision + QC enrich pass ⭐ recommended" },
  { id: "maximum", label: "Maximum", hint: "vision + enrich + দ্বিতীয় মডেল QC retry" },
];

const LOAD_STEPS = [
  "ছবির composition, আলো ও রঙ স্ক্যান হচ্ছে…",
  "Subject, text, cultural cues শনাক্ত করা হচ্ছে…",
  "Viral score ও audience ম্যাপ হচ্ছে…",
  "Facebook হুক ও storytelling caption লেখা হচ্ছে…",
  "X থ্রেড ও Instagram hashtag tiers সাজানো হচ্ছে…",
  "Posting time, format ও improvement tips ঠিক হচ্ছে…",
  "Output validate ও polish করা হচ্ছে…",
];

interface AnalyzeResponse {
  success: boolean;
  analysis: AnalysisResult;
  savedId: number | null;
  modelUsed: string;
  attempts: AttemptInfo[];
  meta: QualityMeta;
  latencyMs: number;
  isFallback: boolean;
  isPartial: boolean;
  fallbackReason: string | null;
  quality?: { score: number; issues: string[] };
  passes?: string[];
  effort?: Effort;
  error?: string;
}

interface ResultMeta {
  brain: BrainId;
  modelUsed: string;
  latencyMs: number;
  meta: QualityMeta;
  attempts: AttemptInfo[];
  isFallback: boolean;
  isPartial: boolean;
  quality?: { score: number; issues: string[] };
  passes?: string[];
  effort?: Effort;
}

interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "err";
}

const brainName = (b: BrainId) => (b === "mistral" ? "Mistral" : "Gemini");

/* ---------------------------------------------------------- */

export default function Home() {
  const [currentBrain, setCurrentBrain] = useState<BrainId>("gemini");
  const [currentModel, setCurrentModel] = useState<string>(MODEL_OPTIONS.gemini[0].id);
  const [geminiKey, setGeminiKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [language, setLanguage] = useState("Bangla / Banglish");
  const [tone, setTone] = useState(TONES[0].id);
  const [objective, setObjective] = useState(OBJECTIVES[0].id);
  const [userNotes, setUserNotes] = useState("");
  const [effort, setEffort] = useState<Effort>("deep");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultMeta, setResultMeta] = useState<ResultMeta | null>(null);
  const [variation, setVariation] = useState(1);
  const [currentDbId, setCurrentDbId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const suiteRef = useRef<PlatformSuiteHandle>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ---------- toasts ---------- */
  const notify = useCallback((msg: string, toneKind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, tone: toneKind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* ---------- boot ---------- */
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/history?limit=40", { cache: "no-store" });
      const data = JSON.parse(await res.text());
      if (data.success && Array.isArray(data.items)) setHistoryItems(data.items);
    } catch (e) {
      console.warn("History load warning:", e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const g = localStorage.getItem("virallens_gemini_key") || "";
      const m = localStorage.getItem("virallens_mistral_key") || "";
      const b = localStorage.getItem("virallens_preferred_brain") as BrainId | null;
      if (g) setGeminiKey(g);
      if (m) setMistralKey(m);
      if (b === "gemini" || b === "mistral") {
        setCurrentBrain(b);
        setCurrentModel(MODEL_OPTIONS[b][0].id);
      }
    } catch {
      /* ignore */
    }
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!isAnalyzing) return;
    setStepIdx(0);
    setElapsed(0);
    const started = Date.now();
    const stepTimer = setInterval(() => setStepIdx((i) => (i + 1) % LOAD_STEPS.length), 2400);
    const clock = setInterval(() => setElapsed(Math.round((Date.now() - started) / 100) / 10), 100);
    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, [isAnalyzing]);

  /* ---------- settings ---------- */
  const handleSaveKeys = (g: string, m: string) => {
    setGeminiKey(g);
    setMistralKey(m);
    try {
      localStorage.setItem("virallens_gemini_key", g);
      localStorage.setItem("virallens_mistral_key", m);
    } catch {
      /* ignore */
    }
    notify("Brain keys সেভ হয়েছে ✓");
  };

  const handleBrainChange = (brain: BrainId, model?: string) => {
    setCurrentBrain(brain);
    setCurrentModel(model || MODEL_OPTIONS[brain][0].id);
    try {
      localStorage.setItem("virallens_preferred_brain", brain);
    } catch {
      /* ignore */
    }
  };

  /* ---------- image ingest ---------- */
  const ingestFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("দয়া করে একটি সঠিক ছবি (JPG, PNG, WebP) নির্বাচন করুন।");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("ছবিটি ২৫MB এর বেশি। অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।");
      return;
    }
    setIsPreparing(true);
    setErrorMsg(null);
    try {
      const prepared = await prepareImageFromFile(file);
      setImage(prepared);
      setResult(null);
      setResultMeta(null);
      setCurrentDbId(null);
      setNotice(null);
      setVariation(1);
      notify(`ছবি রেডি — ${prepared.sizeKb}KB (optimized)`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "ছবি প্রসেস করা যায়নি।");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleLoadSample = async (sample: SampleImage) => {
    setIsPreparing(true);
    setErrorMsg(null);
    try {
      let prepared: PreparedImage;
      try {
        prepared = await prepareImageFromUrl(`/api/proxy-image?url=${encodeURIComponent(sample.url)}`, sample.title);
      } catch {
        prepared = await prepareImageFromSrc(sample.url, sample.title, 0);
      }
      setImage(prepared);
      setUserNotes(sample.notes);
      setTone(sample.suggestedTone);
      setLanguage(sample.suggestedLanguage);
      setResult(null);
      setResultMeta(null);
      setCurrentDbId(null);
      setNotice(null);
      setVariation(1);
    } catch (err) {
      setErrorMsg(`স্যাম্পল লোড করা যায়নি: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setIsPreparing(false);
    }
  };

  /* ---------- local engine ---------- */
  const runLocalEngine = (reason: string, silent = false) => {
    const local = generateSmartDemoAnalysis(userNotes, language, tone, "local-viral-engine");
    setResult(local);
    setResultMeta({
      brain: currentBrain,
      modelUsed: "local-viral-engine",
      latencyMs: 0,
      meta: { completeness: 0, repairs: [] },
      attempts: [],
      isFallback: true,
      isPartial: false,
      quality: { score: 0, issues: [] },
      passes: ["local fallback"],
      effort,
    });
    if (!silent) setNotice(`${reason} লোকাল ভাইরাল ইঞ্জিন দিয়ে সম্পূর্ণ প্যাকেজ তৈরি করা হয়েছে — আসল ছবি-ভিত্তিক বিশ্লেষণের জন্য Settings-এ API key দিন।`);
    setIsFavorite(false);
    setCurrentDbId(null);

    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis: local,
        imageTitle: image?.fileName || "Local analysis",
        thumbnail: image?.thumbnail || "",
        brainUsed: "local-fallback",
        modelUsed: "local-viral-engine",
        language,
        tone,
        objective,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.savedId) setCurrentDbId(d.savedId);
        loadHistory();
      })
      .catch(() => undefined);
  };

  /* ---------- analyze ---------- */
  const handleStartAnalysis = async (opts?: { brain?: BrainId; model?: string; variation?: number; effort?: Effort }) => {
    if (!image?.base64) {
      setErrorMsg("আগে একটি ছবি আপলোড করুন অথবা স্যাম্পল বেছে নিন।");
      return;
    }
    if (isAnalyzing) return;

    const brain = opts?.brain ?? currentBrain;
    const model = opts?.model ?? (opts?.brain && opts.brain !== currentBrain ? MODEL_OPTIONS[opts.brain][0].id : currentModel);
    const nextVariation = opts?.variation ?? variation;
    if (opts?.effort) setEffort(opts.effort);
    if (opts?.brain && opts.brain !== currentBrain) handleBrainChange(opts.brain, model);

    setIsAnalyzing(true);
    setErrorMsg(null);
    setNotice(null);
    setVariation(nextVariation);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 95_000);
    const activeKey = brain === "mistral" ? mistralKey : geminiKey;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          brain,
          model,
          apiKey: activeKey,
          language,
          tone,
          objective,
          userNotes,
          imageTitle: image.fileName || "Uploaded Photo",
          thumbnail: image.thumbnail,
          variation: nextVariation,
          effort,
        }),
      });

      const raw = await response.text();
      let data: AnalyzeResponse;
      try {
        data = JSON.parse(raw) as AnalyzeResponse;
      } catch {
        throw new Error(`সার্ভার JSON এর বদলে অন্য রেসপন্স দিয়েছে (HTTP ${response.status}) — পেলোড ${image.sizeKb}KB`);
      }
      if (!response.ok || !data.success) throw new Error(data.error || `সার্ভার ত্রুটি (HTTP ${response.status})`);

      setResult(data.analysis);
      setResultMeta({
        brain,
        modelUsed: data.modelUsed,
        latencyMs: data.latencyMs,
        meta: data.meta,
        attempts: data.attempts || [],
        isFallback: data.isFallback,
        isPartial: data.isPartial,
        quality: data.quality,
        passes: data.passes,
        effort: data.effort,
      });
      setCurrentDbId(data.savedId ?? null);
      setIsFavorite(false);

      if (data.isFallback) {
        setNotice(
          `লাইভ ${brainName(brain)} উত্তর দিতে পারেনি — কারণ: ${data.fallbackReason || "API key/quota"}। তাই লোকাল ইঞ্জিনের ফলব্যাক প্যাকেজ দেখানো হচ্ছে। Settings-এ সঠিক key দিন (Test বাটনে যাচাই করুন)।`
        );
      } else {
        notify(`${brainName(brain)} বিশ্লেষণ সম্পন্ন — ${(data.latencyMs / 1000).toFixed(1)}s`);
        try {
          confetti({ particleCount: 60, spread: 75, origin: { y: 0.5 }, colors: ["#c6f135", "#8b7cff", "#ff6b5c", "#ffffff"] });
        } catch {
          /* ignore */
        }
      }
      loadHistory();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      const msg = err instanceof Error ? (err.name === "AbortError" ? "রিকোয়েস্ট timeout হয়েছে (95s)।" : err.message) : "unknown";
      console.warn("Analyze failed, using local engine:", msg);
      runLocalEngine(`সার্ভার/AI রেসপন্সে সমস্যা হয়েছে (${msg})।`);
      notify("লাইভ বিশ্লেষণ ব্যর্থ — ফলব্যাক দেখানো হচ্ছে", "err");
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
      setIsAnalyzing(false);
    }
  };

  const cancelAnalysis = () => abortRef.current?.abort();

  /* ---------- favorites / refine ---------- */
  const handleToggleFavorite = async () => {
    if (!currentDbId) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await fetch("/api/history", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: currentDbId, isFavorite: next }) });
      loadHistory();
      notify(next ? "ফেভারিটে যোগ হয়েছে ★" : "ফেভারিট থেকে সরানো হয়েছে");
    } catch {
      /* ignore */
    }
  };

  const handleRefineCaption = async (platform: string, currentText: string, instruction: string) => {
    const activeKey = currentBrain === "mistral" ? mistralKey : geminiKey;
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentText, refinementPrompt: instruction, platform, brain: currentBrain, model: currentModel, apiKey: activeKey }),
      });
      const data = JSON.parse(await res.text());
      if (data.success && data.revisedText) {
        if (data.source === "local") notify("API key ছাড়া লোকাল রিফাইন প্রয়োগ হয়েছে", "err");
        return data.revisedText as string;
      }
    } catch (e) {
      console.warn("Refine failed:", e);
    }
    return `${currentText}\n\n💬 আপনার মতামত কী? কমেন্টে জানিয়ে দিন!`;
  };

  const copyEverything = async () => {
    if (!result) return;
    const r = result;
    const text = `=== VIRALLENS BLUEPRINT · score ${r.strategy.viralScore}/100 ===
${r.strategy.verdict}

[FACEBOOK]
${r.facebookOutput.primaryCaption}

${r.facebookOutput.hashtags.join(" ")}

[X / TWITTER]
${r.twitterOutput.singleTweet}

Thread:
${r.twitterOutput.threadTweets.join("\n\n")}

[INSTAGRAM]
${r.instagramOutput.mainCaption}

${[...r.instagramOutput.tieredHashtags.highReach, ...r.instagramOutput.tieredHashtags.midNiche, ...r.instagramOutput.tieredHashtags.community].join(" ")}

[LINKEDIN]
${r.linkedinOutput.professionalCaption}

${r.linkedinOutput.hashtags.join(" ")}

[BEST TIMES]
FB: ${r.strategy.bestPostingTimes.facebook}
X: ${r.strategy.bestPostingTimes.twitter}
IG: ${r.strategy.bestPostingTimes.instagram}`;
    const ok = await copyText(text);
    notify(ok ? "সম্পূর্ণ ব্লুপ্রিন্ট কপি হয়েছে ✓" : "কপি করা যায়নি", ok ? "ok" : "err");
  };

  const resetImage = () => {
    setImage(null);
    setResult(null);
    setResultMeta(null);
    setCurrentDbId(null);
    setErrorMsg(null);
    setNotice(null);
  };

  const activeKeyPresent = currentBrain === "mistral" ? Boolean(mistralKey) : Boolean(geminiKey);
  const brainLabel = resultMeta ? `${brainName(resultMeta.brain)} · ${resultMeta.modelUsed}` : `${brainName(currentBrain)} · ${currentModel}`;

  /* ====================================================== */

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        currentBrain={currentBrain}
        currentModel={currentModel}
        onBrainChange={handleBrainChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
        hasCustomGeminiKey={Boolean(geminiKey)}
        hasCustomMistralKey={Boolean(mistralKey)}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {/* ---------- banners ---------- */}
        {errorMsg && (
          <div className="rise mb-5 flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral/10 p-4 text-[12.5px] text-ink-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-coral">সমস্যা হয়েছে</p>
              <p className="mt-0.5 break-words leading-relaxed">{errorMsg}</p>
            </div>
            <button type="button" onClick={() => setErrorMsg(null)} className="rounded-md p-1 text-ink-300 hover:text-white" aria-label="dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {notice && (
          <div className="rise mb-5 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-[12.5px] text-ink-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="min-w-0 flex-1 break-words leading-relaxed">{notice}</p>
            <button type="button" onClick={() => setIsSettingsOpen(true)} className="shrink-0 rounded-lg border border-amber/40 bg-amber/15 px-3 py-1 text-[11.5px] font-bold text-amber hover:bg-amber/25">
              Settings
            </button>
            <button type="button" onClick={() => setNotice(null)} className="rounded-md p-1 text-ink-300 hover:text-white" aria-label="dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* ================= CONTROL DECK ================= */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1 no-scrollbar">
            {/* 01 image */}
            <section className="panel overflow-hidden">
              <header className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
                <div>
                  <Kicker className="text-lime">Step 01</Kicker>
                  <h3 className="font-display text-[15px] font-bold text-white">আপনার ছবি</h3>
                </div>
                {image ? (
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-ink-600 px-2.5 py-1.5 text-[11px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white">
                      Replace
                    </button>
                    <button type="button" onClick={resetImage} className="rounded-lg border border-ink-600 p-1.5 text-ink-300 transition hover:border-coral/40 hover:text-coral" title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </header>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await ingestFile(f);
                  e.target.value = "";
                }}
              />

              <div className="p-4">
                {!image ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) await ingestFile(f);
                    }}
                    className={`group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-4 py-12 transition-all ${
                      dragOver ? "border-lime bg-lime/5" : "border-ink-600 bg-ink-900/40 hover:border-lime/50 hover:bg-ink-900/70"
                    } ${isPreparing ? "pointer-events-none opacity-70" : ""}`}
                  >
                    <div className="grid-lines absolute inset-0 opacity-40" />
                    <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition ${dragOver ? "border-lime bg-lime/10 text-lime" : "border-ink-600 bg-ink-800 text-ink-200 group-hover:text-lime"}`}>
                      {isPreparing ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    </span>
                    <div className="relative text-center">
                      <p className="text-[13.5px] font-bold text-white">{isPreparing ? "ছবি optimize হচ্ছে…" : "ছবি ড্রপ করুন বা ক্লিক করে বেছে নিন"}</p>
                      <p className="mt-1 text-[11.5px] text-ink-300">JPG · PNG · WebP — যেকোনো সাইজ, অটো-কমপ্রেস হবে</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.dataUrl} alt={image.fileName} className="max-h-72 w-full object-contain" />
                      {isAnalyzing ? (
                        <div className="reticle absolute inset-0 bg-ink-950/30">
                          <i />
                          <div className="scan-grid absolute inset-0" />
                          <div className="scan-beam" />
                          <div className="absolute bottom-3 left-3 rounded-md bg-ink-950/80 px-2 py-1 font-mono text-[10px] text-lime">
                            ANALYZING · {elapsed.toFixed(1)}s
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip tone="neutral" className="font-mono">
                        {image.width}×{image.height}
                      </Chip>
                      <Chip tone="mint" className="font-mono">
                        <ShieldCheck className="h-3 w-3" /> {image.sizeKb}KB ready
                      </Chip>
                      {image.originalSizeKb > image.sizeKb ? (
                        <Chip tone="neutral" className="font-mono">
                          from {image.originalSizeKb}KB
                        </Chip>
                      ) : null}
                      <span className="ml-auto max-w-[45%] truncate font-mono text-[10.5px] text-ink-400" title={image.fileName}>
                        {image.fileName}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-ink-700 pt-3">
                  <Kicker className="mb-2">অথবা স্যাম্পল দিয়ে টেস্ট করুন</Kicker>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_IMAGES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={isPreparing || isAnalyzing}
                        onClick={() => handleLoadSample(s)}
                        className="group flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/50 p-2 text-left transition hover:border-lime/40 disabled:opacity-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.url} alt={s.title} className="h-9 w-9 shrink-0 rounded-lg border border-ink-700 object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-bold text-ink-100 group-hover:text-lime">{s.title}</p>
                          <p className="truncate text-[10px] text-ink-400">{s.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 02 brain */}
            <section className="panel overflow-hidden">
              <header className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
                <div>
                  <Kicker className="text-lime">Step 02</Kicker>
                  <h3 className="font-display text-[15px] font-bold text-white">AI brain ও মডেল</h3>
                </div>
                <button type="button" onClick={() => setIsSettingsOpen(true)} className="text-[11.5px] font-bold text-lime hover:underline">
                  API key →
                </button>
              </header>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(["gemini", "mistral"] as BrainId[]).map((b) => {
                    const active = currentBrain === b;
                    const hasKey = b === "gemini" ? Boolean(geminiKey) : Boolean(mistralKey);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleBrainChange(b)}
                        className={`relative rounded-xl border p-3 text-left transition ${
                          active ? "border-lime/60 bg-lime/10 ring-1 ring-lime/30" : "border-ink-700 bg-ink-900/50 hover:border-ink-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                            {b === "gemini" ? <GeminiIcon className="h-4 w-4 text-lime" /> : <MistralIcon className="h-4 w-4 text-amber" />}
                            {b === "gemini" ? "Gemini" : "Mistral"}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${hasKey ? "bg-mint" : "bg-ink-500"}`} title={hasKey ? "key set" : "no key"} />
                        </div>
                        <p className="mt-1 text-[10.5px] text-ink-300">{b === "gemini" ? "2.5 Flash / Pro · thinking" : "Pixtral 12B / Large"}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <select value={currentModel} onChange={(e) => setCurrentModel(e.target.value)} className="field appearance-none pr-9 font-mono !text-[12px]">
                    {MODEL_OPTIONS[currentBrain].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.badge}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-ink-300">Effort level — যত বেশি, তত গভীর ও দীর্ঘ রেজাল্ট</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EFFORTS.map((e) => {
                      const active = effort === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setEffort(e.id)}
                          title={e.hint}
                          className={`rounded-xl border px-2 py-2 text-center transition ${
                            active ? "border-lime/60 bg-lime/10 text-lime ring-1 ring-lime/30" : "border-ink-700 bg-ink-900/50 text-ink-300 hover:border-ink-500"
                          }`}
                        >
                          <span className="block text-[12px] font-bold">{e.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-mono text-[10px] text-ink-400">{EFFORTS.find((e) => e.id === effort)?.hint}</p>
                </div>
                {!activeKeyPresent ? (
                  <p className="flex items-center justify-between gap-2 rounded-lg border border-amber/25 bg-amber/10 px-3 py-2 text-[11.5px] font-semibold text-amber">
                    {brainName(currentBrain)} key সেট নেই — env key না থাকলে লোকাল ফলব্যাক চলবে।
                    <button type="button" onClick={() => setIsSettingsOpen(true)} className="underline underline-offset-2 hover:text-white">
                      Add key
                    </button>
                  </p>
                ) : null}
              </div>
            </section>

            {/* 03 voice */}
            <section className="panel overflow-hidden">
              <header className="border-b border-ink-700 px-5 py-3.5">
                <Kicker className="text-lime">Step 03</Kicker>
                <h3 className="font-display text-[15px] font-bold text-white">ভাষা, টোন ও লক্ষ্য</h3>
              </header>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-ink-300">ভাষা</span>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="field">
                      {LANGUAGES.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-ink-300">টোন</span>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="field">
                      {TONES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold text-ink-300">লক্ষ্য</span>
                  <select value={objective} onChange={(e) => setObjective(e.target.value)} className="field">
                    {OBJECTIVES.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold text-ink-300">প্রসঙ্গ / নোট (ঐচ্ছিক — দিলে রেজাল্ট অনেক ভালো হয়)</span>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={2}
                    placeholder={`যেমন: "বন্ধুদের সাথে সাজেক ট্রিপের শেষ সন্ধ্যা", "নতুন cafe launch — Dhanmondi"`}
                    className="field resize-none"
                  />
                </label>

                {isAnalyzing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-2xl border border-lime/30 bg-lime/10 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                          <span className="absolute inset-0 animate-ping rounded-full bg-lime/40" />
                          <Zap className="relative h-4 w-4 text-lime" />
                        </span>
                        <div>
                          <p className="text-[12.5px] font-bold text-white">{LOAD_STEPS[stepIdx]}</p>
                          <p className="font-mono text-[10.5px] text-lime">
                            {brainName(currentBrain)} · {currentModel} · {elapsed.toFixed(1)}s
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={cancelAnalysis} className="rounded-lg border border-ink-600 px-2.5 py-1 text-[11px] font-bold text-ink-200 hover:text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isPreparing || !image}
                    onClick={() => handleStartAnalysis()}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-lime px-5 py-4 font-display text-[15px] font-extrabold text-lime-ink shadow-[0_18px_40px_-16px_rgba(198,241,53,.7)] transition hover:bg-[#d4f85c] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    <Sparkles className="h-5 w-5 transition group-hover:rotate-12" />
                    গভীর বিশ্লেষণ ও ভাইরাল ব্লুপ্রিন্ট বানান
                  </button>
                )}

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => runLocalEngine("ইনস্ট্যান্ট ডেমো মোড।")}
                  className="w-full rounded-xl border border-ink-700 bg-ink-900/50 py-2.5 text-[12px] font-semibold text-ink-300 transition hover:border-ink-500 hover:text-white disabled:opacity-40"
                >
                  ⚡ ইনস্ট্যান্ট ডেমো (API ছাড়া)
                </button>
              </div>
            </section>
          </div>

          {/* ================= RESULTS ================= */}
          <div ref={resultsRef} className="min-w-0 scroll-mt-24 space-y-5">
            {!result ? (
              <EmptyState onBrowse={() => fileInputRef.current?.click()} onOpenSettings={() => setIsSettingsOpen(true)} />
            ) : (
              <>
                {/* result bar */}
                <div className="rise flex flex-wrap items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850/80 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${resultMeta?.isFallback ? "border-amber/40 bg-amber/10 text-amber" : "border-lime/40 bg-lime/10 text-lime"}`}>
                      {resultMeta?.isFallback ? <Info className="h-4 w-4" /> : resultMeta?.brain === "mistral" ? <MistralIcon className="h-4 w-4" /> : <GeminiIcon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-display text-[14px] font-bold text-white">{resultMeta?.isFallback ? "ফলব্যাক ব্লুপ্রিন্ট" : "ব্লুপ্রিন্ট রেডি"}</p>
                      <p className="font-mono text-[10.5px] text-ink-300">{brainLabel}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    {resultMeta && !resultMeta.isFallback ? (
                      <>
                        <Chip tone="neutral" className="font-mono">
                          <Timer className="h-3 w-3" /> {(resultMeta.latencyMs / 1000).toFixed(1)}s
                        </Chip>
                        <Chip tone={resultMeta.meta.completeness >= 90 ? "mint" : resultMeta.meta.completeness >= 62 ? "amber" : "coral"} className="font-mono" title="মডেল নিজে কত % ফিল্ড লিখেছে">
                          {resultMeta.meta.completeness}% model-authored
                        </Chip>
                        {resultMeta.meta.repairs.length ? (
                          <Chip tone="neutral" className="font-mono" title={resultMeta.meta.repairs.join("\n")}>
                            <Wand2 className="h-3 w-3" /> {resultMeta.meta.repairs.length} auto-fix
                          </Chip>
                        ) : null}
                        {resultMeta.attempts.length > 1 ? (
                          <Chip tone="neutral" className="font-mono" title={resultMeta.attempts.map((a) => `${a.model}: ${a.ok ? "ok" : a.error}`).join("\n")}>
                            {resultMeta.attempts.length} attempts
                          </Chip>
                        ) : null}
                        {typeof resultMeta.quality?.score === "number" ? (
                          <Chip
                            tone={resultMeta.quality.score >= 90 ? "mint" : resultMeta.quality.score >= 75 ? "lime" : resultMeta.quality.score >= 60 ? "amber" : "coral"}
                            className="font-mono"
                            title={`QC issues:\n${resultMeta.quality.issues.join("\n") || "none"}`}
                          >
                            QC {resultMeta.quality.score}/100
                          </Chip>
                        ) : null}
                        {resultMeta.effort && resultMeta.effort !== "standard" ? (
                          <Chip tone="violet" className="font-mono">
                            {resultMeta.effort}
                          </Chip>
                        ) : null}
                      </>
                    ) : null}
                    {variation > 1 ? <Chip tone="violet" className="font-mono">variation #{variation}</Chip> : null}
                  </div>

                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isAnalyzing || !image}
                      onClick={() => handleStartAnalysis({ variation: variation + 1 })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/70 px-2.5 py-1.5 text-[11.5px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white disabled:opacity-40"
                      title="একই brain দিয়ে নতুন creative angle"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> নতুন ভার্সন
                    </button>
                    <button
                      type="button"
                      disabled={isAnalyzing || !image}
                      onClick={() => handleStartAnalysis({ brain: currentBrain === "gemini" ? "mistral" : "gemini" })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/70 px-2.5 py-1.5 text-[11.5px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white disabled:opacity-40"
                      title="অন্য brain দিয়ে compare করুন"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" /> {currentBrain === "gemini" ? "Mistral" : "Gemini"} দিয়ে
                    </button>
                    {currentDbId ? (
                      <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className={`rounded-lg border p-1.5 transition ${isFavorite ? "border-amber/50 bg-amber/15 text-amber" : "border-ink-600 bg-ink-800/70 text-ink-300 hover:text-white"}`}
                        title="Favorite"
                      >
                        <Star className={`h-4 w-4 ${isFavorite ? "fill-amber" : ""}`} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={copyEverything}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-3 py-1.5 text-[11.5px] font-bold text-lime-ink transition hover:bg-[#d4f85c] active:scale-95"
                    >
                      <Copy className="h-3.5 w-3.5" /> সব কপি
                    </button>
                  </div>
                </div>

                {resultMeta && (resultMeta.passes?.length || resultMeta.quality?.issues?.length) ? (
                  <details className="rise group rounded-2xl border border-ink-700 bg-ink-850/70 px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] font-bold text-ink-200 transition hover:text-white">
                      <Wand2 className="h-4 w-4 text-lime" />
                      ইঞ্জিন ডায়াগনস্টিকস — কীভাবে এই রেজাল্ট তৈরি হলো
                      <span className="ml-auto font-mono text-[10.5px] text-ink-400 group-open:hidden">দেখুন</span>
                      <ChevronDown className="ml-auto h-4 w-4 text-ink-400 group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime">Pass log</p>
                        <ul className="space-y-1.5">
                          {(resultMeta.passes || []).map((p, i) => (
                            <li key={i} className="flex items-start gap-2 font-mono text-[11px] leading-relaxed text-ink-300">
                              <span className="text-lime">›</span>
                              <span className="break-words">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber">
                          QC-র চোখে দুর্বল জায়গা {resultMeta.quality?.issues?.length ? `(${resultMeta.quality.issues.length})` : ""}
                        </p>
                        {resultMeta.quality?.issues?.length ? (
                          <ul className="space-y-1.5">
                            {resultMeta.quality.issues.map((issue, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-300">
                                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11.5px] text-mint">সব ফিল্ড target length পূরণ করেছে — কোনো দুর্বলতা নেই। ✓</p>
                        )}
                        {resultMeta.quality && resultMeta.quality.score < 90 && !resultMeta.isFallback ? (
                          <button
                            type="button"
                            disabled={isAnalyzing || !image}
                            onClick={() => handleStartAnalysis({ effort: "maximum", variation })}
                            className="mt-2.5 rounded-lg border border-lime/40 bg-lime/10 px-3 py-1.5 text-[11px] font-bold text-lime transition hover:bg-lime/20 disabled:opacity-40"
                          >
                            Maximum effort দিয়ে আবার চালান
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </details>
                ) : null}

                <ViralScoreCard strategy={result.strategy} onUseHook={(hook) => suiteRef.current?.applyHook(hook)} />
                <DeepAnalysisView data={result.deepAnalysis} brainLabel={brainLabel} onNotify={notify} />
                <PlatformSuiteTabs ref={suiteRef} result={result} imageSrc={image?.dataUrl || image?.thumbnail || null} onRefineCaption={handleRefineCaption} onNotify={notify} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto w-full rounded-xl border px-4 py-2.5 text-center text-[12.5px] font-semibold shadow-2xl backdrop-blur ${
              t.tone === "ok" ? "border-mint/40 bg-ink-850/95 text-mint" : "border-coral/40 bg-ink-850/95 text-coral"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} geminiKey={geminiKey} mistralKey={mistralKey} onSaveKeys={handleSaveKeys} />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        isLoading={isHistoryLoading}
        onSelect={(item) => {
          const restored = ensureStrategy({
            deepAnalysis: item.deepAnalysis,
            facebookOutput: item.facebookOutput,
            twitterOutput: item.twitterOutput,
            instagramOutput: item.instagramOutput,
            linkedinOutput: item.linkedinOutput || undefined,
            strategy: item.strategyOutput || undefined,
          });
          setResult(restored);
          const isMistral = /mistral|pixtral/i.test(item.brainUsed);
          setResultMeta({
            brain: isMistral ? "mistral" : "gemini",
            modelUsed: item.modelUsed || item.brainUsed,
            latencyMs: 0,
            meta: item.qualityMeta || { completeness: 100, repairs: [] },
            attempts: [],
            isFallback: /local|fallback/i.test(item.brainUsed),
            isPartial: false,
          });
          setCurrentDbId(item.id);
          setIsFavorite(item.isFavorite);
          setLanguage(item.language);
          setTone(item.tone);
          setNotice(null);
          setErrorMsg(null);
          if (item.imageThumbnail?.startsWith("data:image/")) {
            prepareImageFromSrc(item.imageThumbnail, item.imageTitle, 0)
              .then((p) => setImage(p))
              .catch(() => undefined);
          }
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }}
        onToggleFavorite={async (id, fav) => {
          try {
            await fetch("/api/history", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isFavorite: !fav }) });
            loadHistory();
            if (currentDbId === id) setIsFavorite(!fav);
          } catch {
            /* ignore */
          }
        }}
        onDelete={async (id) => {
          try {
            await fetch(`/api/history?id=${id}`, { method: "DELETE" });
            loadHistory();
            if (currentDbId === id) {
              setResult(null);
              setResultMeta(null);
              setCurrentDbId(null);
            }
            notify("মুছে ফেলা হয়েছে");
          } catch {
            /* ignore */
          }
        }}
        onRefresh={loadHistory}
      />
    </div>
  );
}

/* ---------------------------------------------------------- */

function EmptyState({ onBrowse, onOpenSettings }: { onBrowse: () => void; onOpenSettings: () => void }) {
  const platforms = [
    { icon: <FacebookIcon className="h-4 w-4" />, name: "Facebook", d: "hook + storytelling caption · 8-12 hashtags · first-comment play", c: "#1877f2" },
    { icon: <XIcon className="h-3.5 w-3.5" />, name: "X (Twitter)", d: "≤240-char tweet · 3-tweet thread · quote-bait · alt text", c: "#e7e9ea" },
    { icon: <InstagramIcon className="h-4 w-4" />, name: "Instagram", d: "airy caption · 17 tags in 3 tiers · reel hook · carousel", c: "#e1306c" },
    { icon: <LinkedinIcon className="h-3.5 w-3.5" />, name: "LinkedIn", d: "insight post · takeaway · 4-5 hashtags", c: "#0a66c2" },
  ];
  return (
    <div className="rise space-y-5">
      <section className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="grid-lines absolute inset-0 opacity-30" />
        <div className="relative">
          <Kicker className="mb-3 text-lime">What you get</Kicker>
          <h2 className="text-balance font-display text-2xl font-extrabold leading-tight text-white sm:text-[32px]">
            একটা ছবি দিন — <span className="text-lime">Gemini</span> বা <span className="text-amber">Mistral</span> brain
            <br className="hidden sm:block" /> পুরো ভাইরাল প্ল্যান বানিয়ে দেবে।
          </h2>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-ink-200">
            Expert-level vision analysis, honest viral score, platform-native caption + hashtags, best posting time, আর live preview —
            ঠিক যেমন দেখাবে Facebook, X, Instagram ও LinkedIn-এ।
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={onBrowse} className="rounded-xl bg-lime px-5 py-2.5 text-[13px] font-bold text-lime-ink transition hover:bg-[#d4f85c] active:scale-95">
              ছবি আপলোড করুন
            </button>
            <button type="button" onClick={onOpenSettings} className="rounded-xl border border-ink-600 px-5 py-2.5 text-[13px] font-bold text-ink-200 transition hover:border-lime/40 hover:text-white">
              API key দিন
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {platforms.map((p, i) => (
          <div key={p.name} className="panel-inset rise p-4" style={{ animationDelay: `${120 + i * 70}ms`, borderTop: `2px solid ${p.c}` }}>
            <div className="mb-2 flex items-center gap-2 text-white">
              <span style={{ color: p.c }}>{p.icon}</span>
              <span className="font-display text-[14px] font-bold">{p.name}</span>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-300">{p.d}</p>
            <div className="mt-3 space-y-1.5">
              <div className="skeleton h-2.5 w-11/12" />
              <div className="skeleton h-2.5 w-9/12" />
              <div className="skeleton h-2.5 w-7/12" />
            </div>
          </div>
        ))}
      </div>

      <section className="panel-inset grid gap-4 p-5 sm:grid-cols-3">
        {[
          { n: "01", t: "Upload", d: "ছবি ব্রাউজারেই compress হয় — বড় ছবিতেও fail নেই।" },
          { n: "02", t: "Pick a brain", d: "Gemini 2.5 (thinking) বা Mistral Pixtral — আপনার key, আপনার ব্রাউজারে।" },
          { n: "03", t: "Post", d: "Score, analysis, caption, hashtags, timing — এক ক্লিকে কপি, live preview-এ যাচাই।" },
        ].map((s) => (
          <div key={s.n} className="flex gap-3">
            <span className="font-display text-[13px] font-extrabold text-lime">{s.n}</span>
            <div>
              <p className="text-[13px] font-bold text-white">{s.t}</p>
              <p className="text-[12px] leading-relaxed text-ink-300">{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="flex items-center gap-2 text-[11.5px] text-ink-400">
        <ImageIcon className="h-3.5 w-3.5" /> আপনার ছবি শুধু বিশ্লেষণের জন্য মডেলে যায়; history-তে ছোট thumbnail সেভ হয়।
      </p>
    </div>
  );
}

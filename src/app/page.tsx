"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Cpu,
  Zap,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Info,
  Star,
  Copy,
  ChevronDown,
  Trash2,
  AlertTriangle,
  X,
  Gauge,
  Rocket,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { HistoryModal, HistoryItem } from "@/components/HistoryModal";
import { DeepAnalysisView } from "@/components/DeepAnalysisView";
import { PlatformSuiteTabs } from "@/components/PlatformSuiteTabs";
import { InsightDashboard } from "@/components/InsightDashboard";
import { SAMPLE_IMAGES, SampleImage } from "@/lib/sample-data";
import {
  BRAINS,
  brainById,
  emptyKeys,
  loadKeys,
  saveKeys as persistKeys,
  type BrainId,
  type BrainKeys,
} from "@/lib/brain-config";
import type { AnalysisResult } from "@/lib/ai-brains";
import { generateSmartDemoAnalysis } from "@/lib/demo-analysis";
import {
  PreparedImage,
  prepareImageFromFile,
  prepareImageFromSrc,
  prepareImageFromUrl,
} from "@/lib/image-utils";

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
  { id: "English", label: "English (Viral & Punchy)" },
  { id: "Mixed", label: "Bangla-English Mix" },
];

const ANALYSIS_STAGES = [
  "ভিজ্যুয়াল উপাদান ও কম্পোজিশন স্ক্যান হচ্ছে",
  "রঙ, আলো ও আবেগীয় ভাইব বিশ্লেষণ চলছে",
  "Facebook ভাইরাল হুক আর্কিটেক্ট হচ্ছে",
  "X থ্রেড ও Instagram হ্যাশট্যাগ ক্লাউড তৈরি হচ্ছে",
  "ইনসাইট স্কোর ও স্টোরিবোর্ড প্রস্তুত হচ্ছে",
];

const MARQUEE_TAGS = [
  "#viralpost",
  "#captionideas",
  "#trendingbangla",
  "#instagramgrowth",
  "#facebookviral",
  "#xthread",
  "#storytelling",
  "#contentcreator",
  "#socialmediastrategy",
  "#reelsviral",
  "#hashtagstrategy",
  "#digitalcreator",
];

interface AnalyzeMeta {
  engine?: string;
  modelUsed?: string;
  latencyMs?: number;
  payloadKb?: number;
  generatedAt?: string;
  deepMode?: boolean;
  editorPassUsed?: boolean;
  qualityTier?: string;
  attempts?: string[];
  modelSource?: string;
  requestedModel?: string;
  modelChain?: string[];
  discoveryError?: string;
}

export default function Home() {
  const [currentBrain, setCurrentBrain] = useState<BrainId>("gemini");
  const [currentModel, setCurrentModel] = useState<string>("auto");
  const [keys, setKeys] = useState<BrainKeys>(emptyKeys());

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [language, setLanguage] = useState<string>("Bangla / Banglish");
  const [tone, setTone] = useState<string>("Viral & Catchy 🔥");
  const [objective, setObjective] = useState<string>("Max Reach & Engagement");
  const [userNotes, setUserNotes] = useState<string>("");
  const [deepMode, setDeepMode] = useState<boolean>(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [meta, setMeta] = useState<AnalyzeMeta | null>(null);
  const [currentDbId, setCurrentDbId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [liveModels, setLiveModels] = useState<Partial<Record<BrainId, string[]>>>({});
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedKeys = loadKeys();
    setKeys(storedKeys);
    try {
      const storedBrain = localStorage.getItem("virallens_preferred_brain") as BrainId | null;
      if (storedBrain && BRAINS.some((brain) => brain.id === storedBrain)) setCurrentBrain(storedBrain);
    } catch {
      // ignore
    }
    loadHistory();
    void refreshLiveModels(storedKeys);
  }, []);

  const refreshLiveModels = async (currentKeys: BrainKeys) => {
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiKey: currentKeys.gemini,
          mistralKey: currentKeys.mistral,
          groqKey: currentKeys.groq,
          openrouterKey: currentKeys.openrouter,
          huggingfaceKey: currentKeys.huggingface,
        }),
      });
      const data = JSON.parse(await res.text());
      setLiveModels({
        gemini: data?.gemini?.models || [],
        mistral: data?.mistral?.models || [],
        groq: data?.groq?.models || [],
        openrouter: data?.openrouter?.models || [],
        huggingface: data?.huggingface?.models || [],
      });
    } catch {
      // keep curated list if discovery fails
    }
  };

  const handleSaveKeys = (nextKeys: BrainKeys) => {
    setKeys(nextKeys);
    persistKeys(nextKeys);
    void refreshLiveModels(nextKeys);
  };

  const handleBrainChange = (brain: BrainId, model?: string) => {
    setCurrentBrain(brain);
    setCurrentModel(model || "auto");
    try {
      localStorage.setItem("virallens_preferred_brain", brain);
    } catch {
      // ignore
    }
  };

  const loadHistory = async () => {
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
  };

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
      setCurrentDbId(null);
      setNotice(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "ছবি প্রসেস করা যায়নি।");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await ingestFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await ingestFile(file);
  };

  const handleLoadSample = async (sample: SampleImage) => {
    setIsPreparing(true);
    setErrorMsg(null);
    try {
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(sample.url)}`;
      let prepared: PreparedImage;
      try {
        prepared = await prepareImageFromUrl(proxiedUrl, sample.title);
      } catch {
        prepared = await prepareImageFromSrc(sample.url, sample.title, 0);
      }
      setImage(prepared);
      setUserNotes(sample.notes);
      setTone(sample.suggestedTone);
      setLanguage(sample.suggestedLanguage);
      setResult(null);
      setCurrentDbId(null);
      setNotice(null);
    } catch (err) {
      setErrorMsg(
        `স্যাম্পল ছবি লোড করা যায়নি: ${err instanceof Error ? err.message : "unknown error"}`
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const runLocalEngine = (reason: string) => {
    const local = generateSmartDemoAnalysis(userNotes, language, tone, "local-viral-engine");
    setResult(local);
    setMeta({ engine: "local-viral-engine", modelUsed: currentModel, generatedAt: new Date().toISOString() });
    setNotice(`${reason} তাই লোকাল ভাইরাল ইঞ্জিন দিয়ে সম্পূর্ণ প্যাকেজ তৈরি করা হয়েছে।`);
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
        language,
        tone,
        objective,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.savedId) setCurrentDbId(data.savedId);
        loadHistory();
      })
      .catch(() => undefined);

    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const handleStartAnalysis = async () => {
    if (!image?.base64) {
      setErrorMsg("দয়া করে বিশ্লেষণ করার জন্য একটি ছবি আপলোড করুন অথবা স্যাম্পল ছবি নির্বাচন করুন।");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setNotice(null);
    setProgress(4);
    setAnalysisStep(0);

    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      stageIndex = (stageIndex + 1) % ANALYSIS_STAGES.length;
      setAnalysisStep(stageIndex);
    }, 1700);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 93 ? prev : Math.min(93, prev + Math.random() * 9)));
    }, 700);

    const activeKey = keys[currentBrain];

    try {
      let data: any = null;

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: image.base64,
            mimeType: image.mimeType,
            brain: currentBrain,
            model: currentModel,
            apiKey: activeKey,
            language,
            tone,
            objective,
            userNotes,
            imageTitle: image.fileName || "Uploaded Photo",
            thumbnail: image.thumbnail,
            deepMode,
          }),
        });

        const rawText = await response.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error(
            `সার্ভার JSON এর বদলে HTML রেসপন্স দিয়েছে (HTTP ${response.status})। পেলোড সাইজ: ${image.sizeKb}KB`
          );
        }

        if (!response.ok || !parsed?.success) {
          throw new Error(parsed?.error || `সার্ভার ত্রুটি (HTTP ${response.status})`);
        }

        data = parsed;
      } catch (apiError) {
        console.warn("Analyze API failed, using local engine:", apiError);
        runLocalEngine(
          `সার্ভার/AI রেসপন্সে সমস্যা হয়েছে (${apiError instanceof Error ? apiError.message : "unknown"})।`
        );
        return;
      }

      setProgress(100);
      setResult(data.analysis as AnalysisResult);
      setMeta((data.meta as AnalyzeMeta) || { modelUsed: data.modelUsed });
      setCurrentDbId(data.savedId ?? null);
      setIsFavorite(false);

      if (data.isFallback) {
        setNotice(
          `লাইভ ${brainById(currentBrain).name} API উত্তর দিতে পারেনি, তাই সম্পূর্ণ ফলব্যাক প্যাকেজ দেখানো হচ্ছে। কারণ: ${
            data.fallbackReason || "API key/quota issue"
          } — Settings-এ সঠিক API Key যুক্ত করলে সরাসরি মডেল আউটপুট পাবেন।`
        );
      }

      try {
        confetti({ particleCount: 55, spread: 78, origin: { y: 0.55 }, colors: ["#C6F24E", "#FF7A5B", "#5BC0F2", "#F4F6F2"] });
      } catch {
        // ignore
      }

      loadHistory();
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "অজানা ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
    } finally {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentDbId) return;
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    try {
      await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentDbId, isFavorite: newStatus }),
      });
      loadHistory();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRefineCaption = async (platform: string, currentText: string, instruction: string) => {
    const activeKey = keys[currentBrain];
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentText,
          refinementPrompt: instruction,
          platform,
          brain: currentBrain,
          model: currentModel,
          apiKey: activeKey,
        }),
      });
      const data = JSON.parse(await res.text());
      if (data.success && data.revisedText) return data.revisedText as string;
    } catch (e) {
      console.warn("Refine failed:", e);
    }
    return handleLocalRefine(currentText, instruction);
  };

  const handleLocalRefine = (currentText: string, instruction: string): string => {
    const lower = instruction.toLowerCase();
    if (lower.includes("ছোট") || lower.includes("short")) return currentText.split("\n")[0];
    if (lower.includes("ইমোজি") || lower.includes("emoji")) {
      return `🔥✨ ${currentText} 📸💫\n\n❤️ আপনার মতামত কমেন্টে জানান!`;
    }
    if (lower.includes("বাংলা") || lower.includes("bangla")) {
      return `${currentText}\n\n✨ ছোট্ট একটা কথা — এই মুহূর্তটাই আসল সুখ। আপনার কেমন লাগলো জানান! ❤️`;
    }
    if (lower.includes("ইংলিশ") || lower.includes("english")) {
      return `${currentText}\n\nSave this for later — and tell me what this moment means to you. ✨`;
    }
    return `${currentText}\n\n💬 আপনার মতামত কী? কমেন্টে জানিয়ে দিন!`;
  };

  const resetImage = () => {
    setImage(null);
    setResult(null);
    setCurrentDbId(null);
    setErrorMsg(null);
    setNotice(null);
    setMeta(null);
  };

  return (
    <div className="min-h-screen bg-[#080d14] text-[#f4f6f2] flex flex-col">
      <Header
        currentBrain={currentBrain}
        currentModel={currentModel}
        onBrainChange={handleBrainChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
        configuredBrains={BRAINS.filter((brain) => Boolean(keys[brain.id])).map((brain) => brain.id)}
      />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b border-white/10 grain">
        <div className="absolute inset-0 grid-lines" />

        {/* Hero backdrop image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="images/hero-console.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-45"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080d14] via-[#080d14]/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080d14] to-transparent" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Headline */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C6F24E]/30 bg-[#C6F24E]/8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C6F24E] animate-pulse" />
                <span className="font-mono-label text-[9px] text-[#C6F24E]">
                  5-Brain Vision Engine · Gemini · Mistral · Groq · OpenRouter · HF
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="font-display mt-5 text-[2.4rem] leading-[1.04] sm:text-6xl lg:text-[4.4rem] font-bold text-white"
              >
                ছবিটাকে পড়ুন।
                <br />
                তারপর সেটাকে
                <span className="relative ml-3 inline-block">
                  <span className="relative z-10 text-[#C6F24E]">ভাইরাল</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 bottom-1.5 h-2.5 w-full origin-left bg-[#C6F24E]/25 rounded-full"
                  />
                </span>
                বানান।
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="mt-6 max-w-2xl text-[15px] leading-[1.85] text-white/70"
              >
                একটি ছবি আপলোড করলেই ৫টি ব্রেনের ভিশন ইঞ্জিন (Gemini, Mistral, Groq, OpenRouter, Hugging Face) তার উপাদান, আলো, রঙ ও আবেগ
                গভীরভাবে বিশ্লেষণ করে — আর সেখান থেকেই তৈরি হয়{" "}
                <span className="text-white font-semibold">Facebook</span> ভাইরাল ক্যাপশন,{" "}
                <span className="text-white font-semibold">X</span> থ্রেড,{" "}
                <span className="text-white font-semibold">Instagram</span> ৩-স্তরের হ্যাশট্যাগ,
                এনগেজমেন্ট স্কোর ও পোস্টিং কৌশল।
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28 }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => outputRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="px-6 py-3.5 rounded-full bg-[#C6F24E] text-[#0B121B] font-bold text-sm hover:bg-[#d5f96e] transition-colors flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  এখনই বিশ্লেষণ শুরু করুন
                </button>
                <div className="flex items-center gap-2.5 text-white/55 text-xs">
                  <div className="flex -space-x-2">
                    {["#C6F24E", "#FF7A5B", "#5BC0F2"].map((color) => (
                      <span
                        key={color}
                        className="w-6 h-6 rounded-full border-2 border-[#080d14]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span>
                    <span className="text-white font-semibold">৬টি</span> ডিলিভারেবল সেকশন ·
                    <span className="text-white font-semibold"> ৩০+</span> কপি-রেডি আউটপুট
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Console readout card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl border border-white/12 bg-[#0B121B]/80 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF7A5B]" />
                    <span className="w-2 h-2 rounded-full bg-[#C6F24E]" />
                    <span className="w-2 h-2 rounded-full bg-[#5BC0F2]" />
                    <span className="ml-2 font-mono-label text-[9px] text-white/45">output-preview</span>
                  </div>
                  <span className="font-mono-label text-[9px] text-[#C6F24E]">ready</span>
                </div>

                <div className="p-5 space-y-3.5">
                  {[
                    { label: "01 · Facebook", value: "Viral hook + storytelling caption", color: "#C6F24E" },
                    { label: "02 · X / Twitter", value: "Punchy tweet + 3-part thread", color: "#5BC0F2" },
                    { label: "03 · Instagram", value: "Aesthetic caption + 3-tier hashtags", color: "#FF7A5B" },
                    { label: "04 · Insights", value: "Scores, timing, A/B hooks, storyboard", color: "#F4F6F2" },
                  ].map((row, index) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.45 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-white/8 bg-white/[0.02]"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <div>
                        <div className="font-mono-label text-[9px]" style={{ color: row.color }}>
                          {row.label}
                        </div>
                        <div className="text-[11px] text-white/70 mt-1 leading-relaxed">{row.value}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Marquee band */}
        <div className="relative border-t border-white/10 bg-[#C6F24E]/[0.05] py-2.5 marquee-mask overflow-hidden">
          <div className="marquee-track">
            {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-5 font-mono-label text-[10px] text-white/45 whitespace-nowrap"
              >
                {tag}
                <span className="ml-5 text-[#C6F24E]">◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ MAIN WORKSPACE ============================ */}
      <main
        ref={outputRef}
        className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
      >
        {/* Banners */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-[#FF7A5B]/40 bg-[#FF7A5B]/10 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#FF7A5B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#FFB39D]">সমস্যা হয়েছে</p>
                  <p className="mt-1 text-white/75 leading-relaxed break-words">{errorMsg}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    void handleStartAnalysis();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FF7A5B]/20 hover:bg-[#FF7A5B]/30 text-[#FFB39D] border border-[#FF7A5B]/40 font-semibold"
                >
                  আবার চেষ্টা
                </button>
                <button type="button" onClick={() => setErrorMsg(null)} className="p-1.5 text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-[#5BC0F2]/35 bg-[#5BC0F2]/10 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#5BC0F2] shrink-0 mt-0.5" />
                <span className="text-white/80 leading-relaxed break-words">{notice}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1 rounded-lg bg-[#5BC0F2]/20 hover:bg-[#5BC0F2]/30 text-[#9DD6F7] border border-[#5BC0F2]/40 font-semibold shrink-0"
              >
                Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============ LEFT RAIL: CONSOLE ============ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Upload */}
            <div className="rounded-3xl border border-white/10 bg-[#0B121B]/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#C6F24E] text-[#0B121B] grid place-items-center font-mono-label text-[9px] font-bold">
                    01
                  </span>
                  <span className="text-xs font-semibold text-white">ছবি আপলোড</span>
                </div>
                {image && (
                  <button
                    type="button"
                    onClick={resetImage}
                    className="text-[11px] text-white/50 hover:text-[#FF7A5B] flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    মুছুন
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {!image ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-2xl border border-dashed border-white/15 hover:border-[#C6F24E]/60 bg-white/[0.02] hover:bg-[#C6F24E]/[0.05] p-8 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl border border-[#C6F24E]/30 bg-[#C6F24E]/10 text-[#C6F24E] grid place-items-center mx-auto">
                      {isPreparing ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-white">
                      {isPreparing ? "ছবি অপ্টিমাইজ হচ্ছে..." : "ছবি টেনে আনুন অথবা ক্লিক করুন"}
                    </h4>
                    <p className="mt-1.5 text-[11px] text-white/50 leading-relaxed">
                      যেকোনো সাইজের JPG / PNG / WebP — অটো কমপ্রেস হয়ে দ্রুত বিশ্লেষিত হবে
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.dataUrl} alt="preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-full bg-white/10 border border-white/25 text-xs font-semibold text-white hover:bg-white/20 transition"
                        >
                          অন্য ছবি নির্বাচন করুন
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/55 border border-white/10 font-mono">
                        {image.width}×{image.height}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#C6F24E]/10 text-[#C6F24E] border border-[#C6F24E]/25 font-mono flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {image.sizeKb}KB ready
                      </span>
                      {image.originalSizeKb > image.sizeKb && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 font-mono">
                          was {image.originalSizeKb}KB
                        </span>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Samples */}
                <div className="pt-3 border-t border-white/8">
                  <div className="font-mono-label text-[9px] text-white/40 mb-2">Quick Samples</div>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_IMAGES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleLoadSample(sample)}
                        disabled={isPreparing}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-white/8 bg-white/[0.02] hover:border-[#C6F24E]/40 hover:bg-[#C6F24E]/[0.06] transition-colors text-left disabled:opacity-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sample.url}
                          alt={sample.title}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-white/85 truncate">{sample.title}</p>
                          <p className="text-[9px] text-white/40 truncate">{sample.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Brain */}
            <div className="rounded-3xl border border-white/10 bg-[#0B121B]/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#5BC0F2] text-[#0B121B] grid place-items-center font-mono-label text-[9px] font-bold">
                    02
                  </span>
                  <span className="text-xs font-semibold text-white">AI Brain</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[11px] text-[#5BC0F2] hover:text-[#9DD6F7] flex items-center gap-1"
                >
                  API Key
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {BRAINS.map((brain) => {
                    const active = currentBrain === brain.id;
                    const configured = Boolean(keys[brain.id]);
                    return (
                      <button
                        key={brain.id}
                        type="button"
                        onClick={() => handleBrainChange(brain.id, "auto")}
                        className="relative p-3 rounded-2xl border text-left transition-colors"
                        style={{
                          borderColor: active ? brain.accent : "rgba(255,255,255,0.1)",
                          backgroundColor: active ? `${brain.accent}14` : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: active ? brain.accent : "rgba(255,255,255,0.9)" }}
                          >
                            {brain.name}
                          </span>
                          {configured ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Key configured" />
                          ) : (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/35">
                              key
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[9px] text-white/45">{brain.meta}</div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="font-mono-label text-[9px] text-white/45">Model Version</label>
                  <div className="relative mt-1.5">
                    <select
                      value={currentModel}
                      onChange={(e) => setCurrentModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1720] border border-white/10 text-xs text-white/85 outline-none focus:border-[#C6F24E]/50 appearance-none pr-8 cursor-pointer font-mono"
                    >
                      {brainById(currentBrain).models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.badge}
                        </option>
                      ))}
                      {(liveModels[currentBrain] || [])
                        .filter((id) => !brainById(currentBrain).models.some((m) => m.id === id))
                        .map((id) => (
                          <option key={`live-${id}`} value={id}>
                            {id} — live available
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Deep mode / editor pass */}
                <button
                  type="button"
                  onClick={() => setDeepMode((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors text-left"
                  style={{
                    borderColor: deepMode ? "rgba(198,242,78,0.4)" : "rgba(255,255,255,0.1)",
                    backgroundColor: deepMode ? "rgba(198,242,78,0.08)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div>
                    <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className={`w-3.5 h-3.5 ${deepMode ? "text-[#C6F24E]" : "text-white/40"}`} />
                      Editor Pass (Deep Mode)
                    </div>
                    <div className="text-[9px] text-white/45 mt-0.5">
                      দ্বিতীয় এডিটর পাসে কপি আরও ধারালো হয় · একটু বেশি সময় লাগে
                    </div>
                  </div>
                  <span
                    className="relative w-9 h-5 rounded-full shrink-0 transition-colors"
                    style={{ backgroundColor: deepMode ? "#C6F24E" : "rgba(255,255,255,0.15)" }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-[#0B121B] transition-all"
                      style={{ left: deepMode ? "18px" : "2px" }}
                    />
                  </span>
                </button>
              </div>
            </div>

            {/* Language & tone */}
            <div className="rounded-3xl border border-white/10 bg-[#0B121B]/80 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/10">
                <span className="w-6 h-6 rounded-lg bg-[#FF7A5B] text-[#0B121B] grid place-items-center font-mono-label text-[9px] font-bold">
                  03
                </span>
                <span className="text-xs font-semibold text-white">ভাষা, টোন ও কনটেক্সট</span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="font-mono-label text-[9px] text-white/45">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F1720] border border-white/10 text-xs text-white/85 outline-none focus:border-[#C6F24E]/50 cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono-label text-[9px] text-white/45">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F1720] border border-white/10 text-xs text-white/85 outline-none focus:border-[#C6F24E]/50 cursor-pointer"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono-label text-[9px] text-white/45">
                    Extra Context (optional)
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={3}
                    placeholder={`যেমন: "বন্ধুদের সাথে সাজেক ভ্রমণের স্মৃতি", বা "নতুন স্টার্টআপ লঞ্চিং"...`}
                    className="w-full mt-1.5 p-3 rounded-xl bg-[#0F1720] border border-white/10 text-xs text-white/85 placeholder-white/25 outline-none focus:border-[#C6F24E]/50 resize-none"
                  />
                </div>

                {/* Analyze button */}
                <button
                  type="button"
                  disabled={isAnalyzing || isPreparing || !image}
                  onClick={handleStartAnalysis}
                  className="relative w-full py-4 rounded-2xl bg-[#C6F24E] text-[#0B121B] font-bold text-sm disabled:opacity-45 hover:bg-[#d5f96e] transition-colors flex items-center justify-center gap-2 overflow-hidden"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{ANALYSIS_STAGES[analysisStep]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>গভীর বিশ্লেষণ ও ভাইরাল প্যাকেজ তৈরি করুন</span>
                    </>
                  )}

                  {/* live progress bar */}
                  {isAnalyzing && (
                    <span
                      className="absolute left-0 bottom-0 h-1 bg-[#0B121B]/35"
                      style={{ width: `${progress}%`, transition: "width 0.7s ease-out" }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => runLocalEngine("আপনি ইনস্ট্যান্ট ডেমো মোড বেছে নিয়েছেন।")}
                  className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white/65 hover:text-white text-xs font-semibold transition-colors"
                >
                  ⚡ ইনস্ট্যান্ট ডেমো রেজাল্ট (API ছাড়া)
                </button>
              </div>
            </div>
          </div>

          {/* ============ RIGHT: OUTPUT CANVAS ============ */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-3xl border border-white/10 bg-[#0B121B]/60 overflow-hidden"
                >
                  <div className="absolute inset-0 grid-lines opacity-60" />
                  <div className="relative px-8 py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl border border-[#C6F24E]/30 bg-[#C6F24E]/10 text-[#C6F24E] grid place-items-center">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold text-white">
                      আউটপুট ক্যানভাস প্রস্তুত
                    </h3>
                    <p className="mt-3 max-w-md mx-auto text-sm text-white/55 leading-relaxed">
                      বাম প্যানেল থেকে একটি ছবি নির্বাচন করে বিশ্লেষণ শুরু করুন। ফলাফল এখানে
                      ছয়টি সেকশনে দেখাবে: ডীপ ভিশন ব্রেকডাউন, ইনসাইট স্কোরকার্ড, Facebook, X,
                      Instagram ও LinkedIn পোস্ট স্যুট।
                    </p>

                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto text-left">
                      {[
                        ["Deep Vision", "উপাদান · আলো · রঙ · আবেগ"],
                        ["Scorecard", "Engagement · Share · Save"],
                        ["A/B Hooks", "৩টি বিকল্প প্রথম লাইন"],
                        ["Trend Tags", "২০২৬ ট্রেন্ডিং ট্যাগ"],
                        ["Storyboard", "ক্যারোসেল স্লাইড প্ল্যান"],
                        ["Best Time", "প্ল্যাটফর্ম-ভিত্তিক সময়"],
                      ].map(([title, subtitle]) => (
                        <div key={title} className="p-3 rounded-xl border border-white/8 bg-white/[0.02]">
                          <div className="font-mono-label text-[9px] text-[#C6F24E]">{title}</div>
                          <div className="mt-1 text-[11px] text-white/55">{subtitle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  {/* Result header */}
                  <div className="rounded-3xl border border-white/10 bg-[#0B121B]/80 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#C6F24E] text-[#0B121B] grid place-items-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">বিশ্লেষণ সম্পন্ন হয়েছে</h4>
                          <p className="text-[10px] text-white/50 font-mono mt-0.5">
                            {meta?.engine || currentBrain} · {meta?.modelUsed || currentModel}
                            {typeof meta?.latencyMs === "number" ? ` · ${meta.latencyMs}ms` : ""}
                            {typeof meta?.payloadKb === "number" ? ` · ${meta.payloadKb}KB` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className="text-[8px] font-mono-label px-2 py-0.5 rounded-full border"
                              style={{
                                color:
                                  meta?.qualityTier === "editor-polished"
                                    ? "#C6F24E"
                                    : meta?.qualityTier === "fallback"
                                      ? "#FFB39D"
                                      : "#9DD6F7",
                                borderColor:
                                  meta?.qualityTier === "editor-polished"
                                    ? "rgba(198,242,78,0.35)"
                                    : meta?.qualityTier === "fallback"
                                      ? "rgba(255,122,91,0.4)"
                                      : "rgba(91,192,242,0.35)",
                                backgroundColor:
                                  meta?.qualityTier === "editor-polished"
                                    ? "rgba(198,242,78,0.1)"
                                    : meta?.qualityTier === "fallback"
                                      ? "rgba(255,122,91,0.1)"
                                      : "rgba(91,192,242,0.1)",
                              }}
                            >
                              {meta?.qualityTier === "editor-polished"
                                ? "editor-polished · high effort"
                                : meta?.qualityTier === "fallback"
                                  ? "local engine"
                                  : "vision draft"}
                            </span>
                            {deepMode && <span className="text-[8px] font-mono-label text-white/35">deep mode on</span>}
                            {meta?.modelSource && (
                              <span className="text-[8px] font-mono-label text-white/35">
                                model: {meta.modelSource}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentDbId && (
                          <button
                            type="button"
                            onClick={handleToggleFavorite}
                            className="p-2.5 rounded-xl border transition-colors flex items-center gap-1.5"
                            style={{
                              borderColor: isFavorite ? "rgba(255,122,91,0.45)" : "rgba(255,255,255,0.1)",
                              backgroundColor: isFavorite ? "rgba(255,122,91,0.14)" : "transparent",
                            }}
                            title={isFavorite ? "ফেভারিট থেকে সরান" : "ফেভারিট করুন"}
                          >
                            <Star
                              className={`w-4 h-4 ${isFavorite ? "fill-[#FF7A5B] text-[#FF7A5B]" : "text-white/55"}`}
                            />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const allText = `=== VIRALLENS AI ANALYSIS ===\nVisual: ${result.deepAnalysis.summary}\n\n[FACEBOOK]\n${result.facebookOutput.primaryCaption}\nTags: ${result.facebookOutput.hashtags.join(" ")}\n\n[TWITTER]\n${result.twitterOutput.singleTweet}\n\n[INSTAGRAM]\n${result.instagramOutput.mainCaption}\nTags: ${result.instagramOutput.tieredHashtags.highReach.join(" ")} ${result.instagramOutput.tieredHashtags.midNiche.join(" ")}\n\n[INSIGHTS]\n${result.insights?.viralityVerdict || ""}`;
                            navigator.clipboard.writeText(allText);
                            try {
                              confetti({ particleCount: 32, spread: 55, colors: ["#C6F24E", "#FF7A5B", "#5BC0F2"] });
                            } catch {
                              // ignore
                            }
                            setNotice("সম্পূর্ণ প্যাকেজ ক্লিপবোর্ডে কপি হয়েছে!");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#C6F24E] text-[#0B121B] text-xs font-bold hover:bg-[#d5f96e] transition-colors flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          সব কপি
                        </button>
                      </div>
                    </div>

                    {/* score strip */}
                    {result.insights && (
                      <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/8">
                        {[
                          ["Engagement", result.insights.engagementScore, "#C6F24E"],
                          ["Shareability", result.insights.shareabilityScore, "#FF7A5B"],
                          ["Save Worth", result.insights.saveWorthinessScore, "#5BC0F2"],
                        ].map(([label, value, color]) => (
                          <div key={String(label)} className="px-5 py-3">
                            <div className="font-mono-label text-[8px] text-white/45">{label}</div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xl font-black tabular-nums" style={{ color: String(color) }}>
                                {value}
                              </span>
                              <span className="text-[10px] text-white/35">/100</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <DeepAnalysisView
                    data={result.deepAnalysis}
                    brainUsed={`${meta?.engine || currentBrain} (${meta?.modelUsed || currentModel})`}
                  />

                  {result.insights && (
                    <InsightDashboard
                      insights={result.insights}
                      brainUsed={`${meta?.engine || currentBrain}`}
                    />
                  )}

                  <PlatformSuiteTabs
                    facebook={result.facebookOutput}
                    twitter={result.twitterOutput}
                    instagram={result.instagramOutput}
                    linkedin={result.linkedinOutput}
                    onRefineCaption={handleRefineCaption}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-white">
              ViralLens<span className="text-[#C6F24E]">.ai</span>
            </span>
            <span className="text-[11px] text-white/40">
              গভীর ভিশন বিশ্লেষণ · ভাইরাল কনটেন্ট আর্কিটেকচার
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/35">
            <span>gemini · mistral · groq · openrouter · hf</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>postgres + drizzle</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>v2.1</span>
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        isLoading={isHistoryLoading}
        onSelect={(item) => {
          setResult({
            deepAnalysis: item.deepAnalysis,
            facebookOutput: item.facebookOutput,
            twitterOutput: item.twitterOutput,
            instagramOutput: item.instagramOutput,
            linkedinOutput: item.linkedinOutput || {
              professionalCaption: "",
              keyTakeaway: "",
              hashtags: [],
            },
            insights: item.insights || generateSmartDemoAnalysis().insights,
          });
          setCurrentDbId(item.id);
          setIsFavorite(item.isFavorite);
          setLanguage(item.language);
          setTone(item.tone);
          setMeta({ engine: item.brainUsed });
          setNotice(null);
          setErrorMsg(null);
          if (item.imageThumbnail?.startsWith("data:image/")) {
            prepareImageFromSrc(item.imageThumbnail, item.imageTitle, 0)
              .then((prepared) => setImage(prepared))
              .catch(() => undefined);
          }
        }}
        onToggleFavorite={async (id, currentFav) => {
          try {
            await fetch("/api/history", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, isFavorite: !currentFav }),
            });
            loadHistory();
            if (currentDbId === id) setIsFavorite(!currentFav);
          } catch (e) {
            console.warn(e);
          }
        }}
        onDelete={async (id) => {
          try {
            await fetch(`/api/history?id=${id}`, { method: "DELETE" });
            loadHistory();
            if (currentDbId === id) {
              setResult(null);
              setCurrentDbId(null);
            }
          } catch (e) {
            console.warn(e);
          }
        }}
        onRefresh={loadHistory}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { X, Key, ExternalLink, Check, ShieldCheck, Loader2, AlertCircle, Wifi, Eye, EyeOff } from "lucide-react";
import { Kicker, GeminiIcon, MistralIcon, Chip } from "./Shared";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  mistralKey: string;
  onSaveKeys: (geminiKey: string, mistralKey: string) => void;
}

interface ChainStatus {
  model: string;
  available: boolean;
}

interface ProbeInfo {
  model?: string;
  ok?: boolean;
  status?: number;
  finishReason?: string;
  reply?: string;
  usage?: { input?: number; output?: number; thoughts?: number };
  message?: string;
}

interface TestState {
  loading: boolean;
  done: boolean;
  valid: boolean;
  message: string;
  probe?: ProbeInfo | null;
  chainStatus?: ChainStatus[];
}
const emptyTest: TestState = { loading: false, done: false, valid: false, message: "" };

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, geminiKey: initialGemini, mistralKey: initialMistral, onSaveKeys }) => {
  const [geminiKey, setGeminiKey] = useState(initialGemini);
  const [mistralKey, setMistralKey] = useState(initialMistral);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geminiTest, setGeminiTest] = useState<TestState>(emptyTest);
  const [mistralTest, setMistralTest] = useState<TestState>(emptyTest);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(initialGemini);
      setMistralKey(initialMistral);
      setGeminiTest(emptyTest);
      setMistralTest(emptyTest);
      setShow(false);
    }
  }, [isOpen, initialGemini, initialMistral]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const save = () => {
    onSaveKeys(geminiKey.trim(), mistralKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const testKey = async (brain: "gemini" | "mistral") => {
    const setter = brain === "gemini" ? setGeminiTest : setMistralTest;
    setter({ loading: true, done: false, valid: false, message: "" });
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brain, apiKey: brain === "gemini" ? geminiKey.trim() : mistralKey.trim() }),
      });
      const data = JSON.parse(await res.text());
      setter({
        loading: false,
        done: true,
        valid: Boolean(data.valid) && data.probe?.ok !== false,
        message: data.message || (data.valid ? "Key কাজ করছে ✓" : "Key কাজ করছে না"),
        probe: data.probe || null,
        chainStatus: data.chainStatus || [],
      });
    } catch {
      setter({ loading: false, done: true, valid: false, message: "যাচাই করা যায়নি — ইন্টারনেট সংযোগ দেখুন।" });
    }
  };

  const ChainStrip = ({ t }: { t: TestState }) =>
    t.chainStatus?.length ? (
      <div className="mt-2 flex flex-wrap gap-1">
        {t.chainStatus.map((c) => (
          <span
            key={c.model}
            title={c.available ? "এই key-তে available" : "এই key-তে পাওয়া যাচ্ছে না"}
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] ${
              c.available ? "border-mint/30 bg-mint/10 text-mint" : "border-ink-600 bg-ink-800 text-ink-400 line-through"
            }`}
          >
            {c.model}
          </span>
        ))}
      </div>
    ) : null;

  const status = (t: TestState) => {
    if (t.loading)
      return (
        <p className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> key যাচাই হচ্ছে…
        </p>
      );
    if (!t.done) return null;
    return (
      <p
        className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed ${
          t.valid ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"
        }`}
      >
        {t.valid ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
        <span className="flex-1 break-words">
          {t.message}
          {t.probe?.reply ? (
            <span className="mt-1 block rounded-md border border-ink-700 bg-ink-950/70 px-2 py-1 font-mono text-[10.5px] text-ink-300">
              probe reply: {t.probe.reply}
            </span>
          ) : null}
          {t.probe && t.probe.ok === false ? (
            <span className="mt-1 block font-mono text-[10.5px] text-amber">
              probe {t.probe.model} → {t.probe.finishReason || `HTTP ${t.probe.status}`} {t.probe.message ? `· ${t.probe.message}` : ""}
            </span>
          ) : null}
          {t.probe?.usage ? (
            <span className="mt-1 block font-mono text-[10px] text-ink-400">
              tokens: in {t.probe.usage.input ?? 0} · out {t.probe.usage.output ?? 0}
              {t.probe.usage.thoughts ? ` · thinking ${t.probe.usage.thoughts}` : ""}
            </span>
          ) : null}
        </span>
      </p>
    );
  };

  const KeyRow = ({
    brain,
    label,
    icon,
    value,
    onChange,
    placeholder,
    link,
    linkLabel,
    test,
    accent,
  }: {
    brain: "gemini" | "mistral";
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    link: string;
    linkLabel: string;
    test: TestState;
    accent: string;
  }) => (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[13px] font-bold text-white">
          <span style={{ color: accent }}>{icon}</span>
          {label}
          {value ? <Chip tone="mint" className="!py-0 font-mono !text-[9.5px]">••••{value.slice(-4)}</Chip> : <Chip tone="neutral" className="!py-0 font-mono !text-[9.5px]">not set</Chip>}
        </label>
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] font-semibold hover:underline" style={{ color: accent }}>
          {linkLabel} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="field font-mono !text-[12.5px]"
        />
        <button
          type="button"
          onClick={() => testKey(brain)}
          disabled={test.loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-bold transition disabled:opacity-50"
          style={{ borderColor: `${accent}55`, color: accent, background: `${accent}14` }}
        >
          <Wifi className="h-3.5 w-3.5" /> Test
        </button>
      </div>
      {status(test)}
      <ChainStrip t={test} />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="toast-in w-full max-w-lg overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-ink-700 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-lime">
            <Key className="h-4 w-4" />
          </span>
          <div>
            <Kicker className="text-lime">Brains</Kicker>
            <h3 className="font-display text-lg font-bold text-white">API key configuration</h3>
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg border border-ink-600 p-2 text-ink-300 transition hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850 p-3.5 text-[12px] leading-relaxed text-ink-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
            <p>
              Key শুধু আপনার ব্রাউজারে (localStorage) থাকে এবং প্রতিটি রিকোয়েস্টে সার্ভার হয়ে সরাসরি Gemini / Mistral-এ যায় — আমাদের ডাটাবেসে কখনো সেভ হয় না।
            </p>
          </div>

          <KeyRow
            brain="gemini"
            label="Google Gemini"
            icon={<GeminiIcon className="h-4 w-4" />}
            value={geminiKey}
            onChange={(v) => {
              setGeminiKey(v);
              setGeminiTest(emptyTest);
            }}
            placeholder="AIzaSy… (gemini-2.5-flash)"
            link="https://aistudio.google.com/app/apikey"
            linkLabel="Free key"
            test={geminiTest}
            accent="#c6f135"
          />

          <KeyRow
            brain="mistral"
            label="Mistral AI"
            icon={<MistralIcon className="h-4 w-4" />}
            value={mistralKey}
            onChange={(v) => {
              setMistralKey(v);
              setMistralTest(emptyTest);
            }}
            placeholder="Mistral API key (pixtral vision)"
            link="https://console.mistral.ai/api-keys/"
            linkLabel="Console"
            test={mistralTest}
            accent="#ffc34d"
          />

          <p className="rounded-xl border border-ink-700 bg-ink-850 p-3 text-[11.5px] leading-relaxed text-ink-300">
            <span className="font-semibold text-ink-100">Tip:</span> key না থাকলেও app fail করবে না — লোকাল ভাইরাল ইঞ্জিন প্যাকেজ বানিয়ে দেবে। কিন্তু আসল ছবি-ভিত্তিক deep analysis পেতে একটি key দিন (Gemini-এর free tier যথেষ্ট)।
          </p>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-ink-700 bg-ink-850/60 px-5 py-4">
          <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-300 hover:text-white">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {show ? "Hide keys" : "Show keys"}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-[12px] font-semibold text-ink-300 hover:text-white">
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={save}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12.5px] font-bold transition active:scale-95 ${
                saved ? "bg-mint text-ink-950" : "bg-lime text-lime-ink hover:bg-[#d4f85c]"
              }`}
            >
              {saved ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
              {saved ? "সেভ হয়েছে" : "সেভ করুন"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

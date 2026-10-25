"use client";

import React, { useState } from "react";
import {
  X,
  Key,
  ExternalLink,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Activity,
} from "lucide-react";
import { BRAINS, type BrainId, type BrainKeys } from "@/lib/brain-config";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: BrainKeys;
  onSaveKeys: (keys: BrainKeys) => void;
}

interface TestState {
  loading: boolean;
  done: boolean;
  valid: boolean;
  message: string;
}

const emptyTest: TestState = { loading: false, done: false, valid: false, message: "" };

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  keys: initialKeys,
  onSaveKeys,
}) => {
  const [keys, setKeys] = useState<BrainKeys>(initialKeys);
  const [saved, setSaved] = useState(false);
  const [tests, setTests] = useState<Partial<Record<BrainId, TestState>>>({});
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [reports, setReports] = useState<
    Array<{ brain: string; label: string; ok: boolean; latencyMs: number; model?: string; code?: string; error?: string; hint?: string }>
  >([]);
  const [verdict, setVerdict] = useState("");

  if (!isOpen) return null;

  const setTest = (brain: BrainId, state: TestState) =>
    setTests((prev) => ({ ...prev, [brain]: state }));

  const testKey = async (brain: BrainId) => {
    setTest(brain, { loading: true, done: false, valid: false, message: "" });
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brain, apiKey: keys[brain].trim() }),
      });
      const data = JSON.parse(await res.text());
      setTest(brain, {
        loading: false,
        done: true,
        valid: Boolean(data.valid),
        message: data.message || (data.valid ? "Key কাজ করছে ✅" : "Key কাজ করছে না"),
      });
    } catch {
      setTest(brain, {
        loading: false,
        done: true,
        valid: false,
        message: "যাচাই করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      });
    }
  };

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    setReports([]);
    setVerdict("");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brain: "all",
          geminiKey: keys.gemini.trim(),
          mistralKey: keys.mistral.trim(),
          groqKey: keys.groq.trim(),
          openrouterKey: keys.openrouter.trim(),
          huggingfaceKey: keys.huggingface.trim(),
        }),
      });
      const data = JSON.parse(await res.text());
      setReports(data.reports || []);
      setVerdict(data.verdict || "");
    } catch {
      setVerdict("ডায়াগনস্টিক চালানো যায়নি (নেটওয়ার্ক)।");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSave = () => {
    onSaveKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0B121B] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C6F24E]/10 text-[#C6F24E] border border-[#C6F24E]/25">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">5-Brain API Configuration</h3>
              <p className="text-[11px] text-white/45">Gemini · Mistral · Groq · OpenRouter · Hugging Face</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3 text-[11px] text-white/65">
            <ShieldCheck className="w-5 h-5 text-[#C6F24E] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white">গোপনীয়তা:</span> কী শুধু আপনার ব্রাউজারে থাকে, সার্ভারে সেভ হয় না। একাধিক ব্রেন কনফিগার করলে একটির কোটা শেষ হলে অন্যটি দিয়ে কাজ চলবে।
            </div>
          </div>

          {BRAINS.map((brain) => {
            const test = tests[brain.id] || emptyTest;
            return (
              <div key={brain.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brain.accent }} />
                    {brain.name}
                    <span className="text-[9px] font-mono-label px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                      {brain.meta}
                    </span>
                  </label>
                  <a
                    href={brain.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] flex items-center gap-1 hover:underline"
                    style={{ color: brain.accent }}
                  >
                    Key নিন
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={keys[brain.id]}
                    onChange={(e) => {
                      setKeys((prev) => ({ ...prev, [brain.id]: e.target.value }));
                      setTest(brain.id, emptyTest);
                    }}
                    placeholder={brain.placeholder}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0F1720] border border-white/10 focus:border-white/30 text-sm text-white placeholder-white/25 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => testKey(brain.id)}
                    disabled={test.loading}
                    className="px-3 py-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                    style={{ borderColor: `${brain.accent}55`, color: brain.accent, backgroundColor: `${brain.accent}14` }}
                  >
                    {test.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Test
                  </button>
                </div>

                {test.done && (
                  <div
                    className="flex items-start gap-2 text-[11px] rounded-lg px-3 py-2 border leading-relaxed"
                    style={{
                      borderColor: test.valid ? "rgba(52,211,153,0.4)" : "rgba(255,122,91,0.4)",
                      backgroundColor: test.valid ? "rgba(52,211,153,0.08)" : "rgba(255,122,91,0.08)",
                      color: test.valid ? "#A7F3D0" : "#FFB39D",
                    }}
                  >
                    {test.valid ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    <span className="break-words">{test.message}</span>
                  </div>
                )}

                <p className="text-[10px] text-white/35">
                  {brain.freeNote} · খালি রাখলে সার্ভারের env key (যদি থাকে) ব্যবহার হবে
                </p>
              </div>
            );
          })}

          {/* Full diagnostics */}
          <div className="space-y-2.5 p-3.5 rounded-xl border border-white/10 bg-[#0F1720]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#C6F24E]" />
                  Full Brain Diagnostics
                </div>
                <p className="text-[10px] text-white/45 mt-0.5">সব ব্রেনে সত্যিকারের ভিশন কল — কে কাজ করছে, কেন ফেল করছে</p>
              </div>
              <button
                type="button"
                disabled={isDiagnosing}
                onClick={runDiagnostics}
                className="px-3 py-2 rounded-lg bg-[#C6F24E] text-[#0B121B] text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-60 shrink-0"
              >
                {isDiagnosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                {isDiagnosing ? "টেস্ট চলছে..." : "Run All"}
              </button>
            </div>

            {verdict && <p className="text-[11px] text-white/70 leading-relaxed">{verdict}</p>}

            {reports.map((report) => (
              <div
                key={report.brain}
                className="p-3 rounded-lg border text-[11px] leading-relaxed"
                style={{
                  borderColor: report.ok ? "rgba(198,242,78,0.35)" : "rgba(255,122,91,0.4)",
                  backgroundColor: report.ok ? "rgba(198,242,78,0.07)" : "rgba(255,122,91,0.08)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">
                    {report.ok ? "✅" : "❌"} {report.label}
                  </span>
                  <span className="font-mono text-[10px] text-white/45">{report.latencyMs}ms</span>
                </div>
                {report.ok ? (
                  <p className="text-white/60 mt-1 font-mono text-[10px]">{report.model}</p>
                ) : (
                  <>
                    <p className="mt-1 text-[#FFB39D] font-medium">{report.code}: {report.error}</p>
                    {report.hint && <p className="mt-1 text-white/60">→ {report.hint}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-white/10 bg-white/[0.02] gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition">
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B121B] flex items-center gap-2 transition"
            style={{ backgroundColor: saved ? "#34d399" : "#C6F24E" }}
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {saved ? "সংরক্ষণ সম্পন্ন!" : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

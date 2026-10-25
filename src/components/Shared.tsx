"use client";

import React, { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

/* ---------------- brand / platform icons ---------------- */

export const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
    <rect x="2" y="2" width="36" height="36" rx="11" stroke="var(--color-lime)" strokeWidth="2.2" />
    <circle cx="20" cy="20" r="8.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="20" cy="20" r="3" fill="var(--color-lime)" />
    <path d="M20 2v6M20 32v6M2 20h6M32 20h6" stroke="var(--color-lime)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M27.5 12.5l2.5-2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
  </svg>
);

export const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const GeminiIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 2.5l2.1 7.4 7.4 2.1-7.4 2.1L12 21.5l-2.1-7.4-7.4-2.1 7.4-2.1L12 2.5z" fill="currentColor" />
    <circle cx="19" cy="5" r="1.4" fill="currentColor" opacity="0.7" />
    <circle cx="5" cy="19" r="1.2" fill="currentColor" opacity="0.7" />
  </svg>
);

export const MistralIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 20c8.5 0 13-4.5 15-13l-3.2.9C13.5 13 10 16.5 3 16.5V20z" fill="currentColor" />
    <path d="M8.5 21c7.5 0 11.5-3 12.5-11.5L17.5 10C16 15 13 18.5 8.5 18.5V21z" fill="currentColor" opacity="0.6" />
  </svg>
);

/* ---------------- primitives ---------------- */

export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-300 ${className}`}>
      {children}
    </p>
  );
}

type ChipTone = "neutral" | "lime" | "coral" | "violet" | "cyan" | "amber" | "mint" | "fb" | "ig" | "li" | "x";

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: "border-ink-600 bg-ink-800/80 text-ink-200",
  lime: "border-lime/30 bg-lime/10 text-lime",
  coral: "border-coral/30 bg-coral/10 text-coral",
  violet: "border-violet/30 bg-violet/10 text-violet",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  amber: "border-amber/30 bg-amber/10 text-amber",
  mint: "border-mint/30 bg-mint/10 text-mint",
  fb: "border-fb/40 bg-fb/15 text-[#8cbcff]",
  ig: "border-ig/40 bg-ig/15 text-[#ff8ab3]",
  li: "border-li/40 bg-li/15 text-[#7fb6ff]",
  x: "border-ink-400 bg-ink-100/10 text-ink-100",
};

export function Chip({
  children,
  tone = "neutral",
  className = "",
  onClick,
  title,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const base = `inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold leading-5 ${CHIP_TONES[tone]} ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={`${base} transition hover:brightness-125 active:scale-95`}>
        {children}
      </button>
    );
  }
  return (
    <span className={base} title={title}>
      {children}
    </span>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label = "কপি",
  doneLabel = "কপি হয়েছে",
  onCopied,
  variant = "ghost",
  size = "sm",
  className = "",
}: {
  text: string;
  label?: string;
  doneLabel?: string;
  onCopied?: (msg: string) => void;
  variant?: "ghost" | "solid" | "lime";
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const handle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const ok = await copyText(text);
      if (ok) {
        setDone(true);
        onCopied?.(`${doneLabel} ✓`);
        setTimeout(() => setDone(false), 1500);
      } else {
        onCopied?.("কপি করা যায়নি");
      }
    },
    [text, onCopied, doneLabel]
  );

  const sizes = {
    xs: "px-2 py-1 text-[10.5px] gap-1",
    sm: "px-2.5 py-1.5 text-[11.5px] gap-1.5",
    md: "px-3.5 py-2 text-xs gap-2",
  }[size];

  const variants = {
    ghost: "border border-ink-600 bg-ink-800/70 text-ink-200 hover:border-lime/40 hover:text-white",
    solid: "border border-ink-500 bg-ink-700 text-white hover:bg-ink-600",
    lime: "border border-lime/0 bg-lime text-lime-ink hover:bg-[#d4f85c] shadow-[0_8px_24px_-10px_rgba(198,241,53,.6)]",
  }[variant];

  return (
    <button
      type="button"
      onClick={handle}
      className={`inline-flex items-center rounded-lg font-semibold transition-all active:scale-95 ${sizes} ${variants} ${
        done ? "!border-mint/50 !text-mint" : ""
      } ${className}`}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{done ? doneLabel : label}</span>
    </button>
  );
}

export function HashtagCloud({
  tags,
  tone = "neutral",
  onCopied,
  label,
}: {
  tags: string[];
  tone?: ChipTone;
  onCopied?: (msg: string) => void;
  label?: string;
}) {
  if (!tags?.length) return null;
  return (
    <div className="space-y-2">
      {(label || onCopied) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <Kicker>
              {label} <span className="text-ink-400">({tags.length})</span>
            </Kicker>
          ) : (
            <span />
          )}
          <CopyButton text={tags.join(" ")} label="সব ট্যাগ কপি" size="xs" onCopied={onCopied} />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <Chip
            key={`${t}-${i}`}
            tone={tone}
            title="ক্লিক করে কপি"
            onClick={async () => {
              const ok = await copyText(t);
              onCopied?.(ok ? `${t} কপি হয়েছে ✓` : "কপি করা যায়নি");
            }}
          >
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** Highlights #hashtags and @mentions inside caption text */
export function renderRichText(text: string, tagClass = "text-[#4ea1ff]") {
  const parts = text.split(/((?:#|@)[\p{L}\p{N}_]+)/u);
  return parts.map((part, i) =>
    /^(#|@)[\p{L}\p{N}_]+$/u.test(part) ? (
      <span key={i} className={tagClass}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export function scoreTone(score: number): { color: string; label: string; tone: ChipTone } {
  if (score >= 80) return { color: "var(--color-lime)", label: "Viral potential", tone: "lime" };
  if (score >= 65) return { color: "var(--color-mint)", label: "Strong reach", tone: "mint" };
  if (score >= 50) return { color: "var(--color-amber)", label: "Solid — push it", tone: "amber" };
  return { color: "var(--color-coral)", label: "Needs a boost", tone: "coral" };
}

export function timeAgo(ts: string | Date): string {
  const t = new Date(ts).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

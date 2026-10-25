"use client";

import React, { useState } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Repeat2,
  Heart,
  BarChart2,
  Bookmark,
  Send,
  MoreHorizontal,
  BadgeCheck,
  Globe,
} from "lucide-react";
import { renderRichText, LogoMark } from "./Shared";

export type PreviewPlatform = "facebook" | "twitter" | "instagram" | "linkedin";

interface PostPreviewProps {
  platform: PreviewPlatform;
  caption: string;
  hashtags?: string[];
  imageSrc?: string | null;
  name?: string;
  handle?: string;
}

function Avatar({ name, ring = false, square = false }: { name: string; ring?: boolean; square?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "V";
  const inner = (
    <div
      className={`flex h-10 w-10 items-center justify-center ${square ? "rounded-lg" : "rounded-full"} bg-gradient-to-br from-lime via-mint to-violet font-display text-sm font-bold text-ink-950`}
    >
      {initial}
    </div>
  );
  if (!ring) return inner;
  return (
    <div className="rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[2px]">
      <div className="rounded-full bg-black p-[2px]">{inner}</div>
    </div>
  );
}

function ImageBlock({ src, className = "", rounded = "" }: { src?: string | null; className?: string; rounded?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="post" className={`w-full object-cover ${className} ${rounded}`} />;
  }
  return (
    <div className={`grid-lines flex w-full items-center justify-center bg-ink-800 text-ink-400 ${className} ${rounded}`}>
      <LogoMark className="h-10 w-10 opacity-50" />
    </div>
  );
}

function ClampText({
  text,
  limit,
  className,
  tagClass,
  moreLabel = "See more",
  moreClass = "text-ink-300",
}: {
  text: string;
  limit: number;
  className?: string;
  tagClass?: string;
  moreLabel?: string;
  moreClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const needsClamp = text.length > limit;
  const shown = open || !needsClamp ? text : `${text.slice(0, limit).trimEnd()}…`;
  return (
    <p className={`whitespace-pre-wrap break-words ${className || ""}`}>
      {renderRichText(shown, tagClass)}
      {needsClamp && !open ? (
        <button type="button" onClick={() => setOpen(true)} className={`ml-1 font-semibold hover:underline ${moreClass}`}>
          {moreLabel}
        </button>
      ) : null}
    </p>
  );
}

/* ================= FACEBOOK ================= */
function FacebookPreview({ caption, hashtags, imageSrc, name }: PostPreviewProps & { name: string }) {
  const full = hashtags?.length ? `${caption}\n\n${hashtags.join(" ")}` : caption;
  return (
    <div className="overflow-hidden rounded-xl bg-[#242526] text-[#e4e6eb] shadow-xl" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight text-[#e4e6eb]">{name}</p>
          <p className="flex items-center gap-1 text-[12px] text-[#b0b3b8]">
            Just now · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#b0b3b8]" />
      </div>
      <div className="px-4 pb-3 pt-2.5">
        <ClampText text={full} limit={420} className="text-[15px] leading-[1.35]" tagClass="text-[#4599ff]" moreClass="text-[#b0b3b8]" />
      </div>
      <ImageBlock src={imageSrc} className="max-h-[380px] bg-black" />
      <div className="flex items-center justify-between px-4 py-2.5 text-[13px] text-[#b0b3b8]">
        <span className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1877f2] text-[10px]">👍</span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f33e58] text-[10px]">❤️</span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f7b125] text-[10px]">😮</span>
          </span>
          1.2K
        </span>
        <span>248 comments · 97 shares</span>
      </div>
      <div className="mx-4 flex border-t border-[#3e4042] py-1 text-[14px] font-semibold text-[#b0b3b8]">
        {[
          { icon: <ThumbsUp className="h-[18px] w-[18px]" />, label: "Like" },
          { icon: <MessageCircle className="h-[18px] w-[18px]" />, label: "Comment" },
          { icon: <Share2 className="h-[18px] w-[18px]" />, label: "Share" },
        ].map((a) => (
          <span key={a.label} className="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 hover:bg-[#3a3b3c]">
            {a.icon}
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================= X / TWITTER ================= */
function XPreview({ caption, hashtags, imageSrc, name, handle }: PostPreviewProps & { name: string; handle: string }) {
  const text = hashtags?.length && !caption.includes("#") ? `${caption}\n\n${hashtags.slice(0, 2).join(" ")}` : caption;
  return (
    <div className="rounded-2xl border border-[#2f3336] bg-black p-4 text-[#e7e9ea] shadow-xl" style={{ fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="flex gap-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]">
            <span className="truncate font-bold">{name}</span>
            <BadgeCheck className="h-4 w-4 fill-[#1d9bf0] text-black" />
            <span className="truncate text-[#71767b]">@{handle} · now</span>
            <MoreHorizontal className="ml-auto h-4 w-4 text-[#71767b]" />
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-[1.35]">{renderRichText(text, "text-[#1d9bf0]")}</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#2f3336]">
            <ImageBlock src={imageSrc} className="max-h-[360px]" />
          </div>
          <div className="mt-3 flex items-center justify-between pr-4 text-[13px] text-[#71767b]">
            <span className="flex items-center gap-1.5 hover:text-[#1d9bf0]">
              <MessageCircle className="h-[18px] w-[18px]" /> 86
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#00ba7c]">
              <Repeat2 className="h-[18px] w-[18px]" /> 312
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#f91880]">
              <Heart className="h-[18px] w-[18px]" /> 1.4K
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-[18px] w-[18px]" /> 48K
            </span>
            <span className="flex items-center gap-3">
              <Bookmark className="h-[18px] w-[18px]" />
              <Share2 className="h-[18px] w-[18px]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= INSTAGRAM ================= */
function InstagramPreview({ caption, hashtags, imageSrc, handle }: PostPreviewProps & { handle: string }) {
  const [liked, setLiked] = useState(false);
  const full = hashtags?.length ? `${caption}\n\n${hashtags.join(" ")}` : caption;
  return (
    <div className="overflow-hidden rounded-xl border border-[#262626] bg-black text-white shadow-xl" style={{ fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="scale-[0.82] -m-1">
          <Avatar name={handle} ring />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
          <span className="truncate font-semibold">{handle}</span>
          <BadgeCheck className="h-3.5 w-3.5 fill-[#0095f6] text-black" />
          <span className="text-[#a8a8a8]">•</span>
          <span className="font-semibold text-[#0095f6]">Follow</span>
        </div>
        <MoreHorizontal className="h-5 w-5" />
      </div>
      <div className="aspect-[4/5] w-full overflow-hidden bg-[#111]">
        <ImageBlock src={imageSrc} className="h-full" />
      </div>
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setLiked((v) => !v)} aria-label="like">
            <Heart className={`h-6 w-6 transition ${liked ? "fill-[#ff3040] text-[#ff3040] scale-110" : ""}`} />
          </button>
          <MessageCircle className="h-6 w-6 -scale-x-100" />
          <Send className="h-6 w-6" />
        </div>
        <Bookmark className="h-6 w-6" />
      </div>
      <div className="space-y-1 px-3 pb-3.5 pt-2.5 text-[13.5px] leading-[1.4]">
        <p className="font-semibold">{liked ? "1,249" : "1,248"} likes</p>
        <div>
          <span className="mr-1.5 font-semibold">{handle}</span>
          <ClampText text={full} limit={140} className="inline" tagClass="text-[#e0f1ff]" moreLabel="more" moreClass="text-[#a8a8a8]" />
        </div>
        <p className="text-[#a8a8a8]">View all 86 comments</p>
        <p className="text-[10px] uppercase tracking-wide text-[#a8a8a8]">2 minutes ago</p>
      </div>
    </div>
  );
}

/* ================= LINKEDIN ================= */
function LinkedinPreview({ caption, hashtags, imageSrc, name }: PostPreviewProps & { name: string }) {
  const full = hashtags?.length ? `${caption}\n\n${hashtags.join(" ")}` : caption;
  return (
    <div className="overflow-hidden rounded-xl border border-[#38434f] bg-[#1b1f23] text-[#ffffffe6] shadow-xl" style={{ fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="flex items-start gap-2.5 px-4 pt-3.5">
        <Avatar name={name} square />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-tight">{name}</p>
          <p className="text-[12px] text-[#ffffff99]">Creator · Growth Strategist</p>
          <p className="flex items-center gap-1 text-[12px] text-[#ffffff99]">
            Now · <Globe className="h-3 w-3" />
          </p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#ffffff99]" />
      </div>
      <div className="px-4 pb-3 pt-2.5">
        <ClampText text={full} limit={300} className="text-[14px] leading-[1.45]" tagClass="text-[#70b5f9]" moreLabel="…see more" moreClass="text-[#ffffff99]" />
      </div>
      <ImageBlock src={imageSrc} className="max-h-[360px] bg-black" />
      <div className="flex items-center justify-between px-4 py-2 text-[12px] text-[#ffffff99]">
        <span className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#378fe9] text-[9px]">👍</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f5bb5c] text-[9px]">💡</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#df704d] text-[9px]">❤️</span>
          </span>
          248
        </span>
        <span>32 comments · 11 reposts</span>
      </div>
      <div className="mx-3 flex border-t border-[#38434f] py-1 text-[13px] font-semibold text-[#ffffff99]">
        {[
          { icon: <ThumbsUp className="h-4 w-4" />, label: "Like" },
          { icon: <MessageCircle className="h-4 w-4" />, label: "Comment" },
          { icon: <Repeat2 className="h-4 w-4" />, label: "Repost" },
          { icon: <Send className="h-4 w-4" />, label: "Send" },
        ].map((a) => (
          <span key={a.label} className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 hover:bg-[#ffffff14]">
            {a.icon}
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PostPreview(props: PostPreviewProps) {
  const name = props.name || "ViralLens Creator";
  const handle = props.handle || "virallens.creator";
  switch (props.platform) {
    case "facebook":
      return <FacebookPreview {...props} name={name} />;
    case "twitter":
      return <XPreview {...props} name={name} handle={handle} />;
    case "instagram":
      return <InstagramPreview {...props} handle={handle} />;
    case "linkedin":
      return <LinkedinPreview {...props} name={name} />;
    default:
      return null;
  }
}

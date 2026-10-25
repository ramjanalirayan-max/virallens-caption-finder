import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralLens AI — গভীর ইমেজ বিশ্লেষণ ও ভাইরাল কনটেন্ট আর্কিটেক্ট",
  description:
    "যে কোনো ছবি থেকে Facebook, X (Twitter), Instagram ও LinkedIn এর জন্য ভাইরাল ক্যাপশন, ৩-স্তরের হ্যাশট্যাগ, এনগেজমেন্ট স্কোর ও পোস্টিং কৌশল — Gemini ও Mistral মাল্টি-ব্রেন ভিশন ইঞ্জিনে।",
  keywords: [
    "viral caption",
    "image analysis AI",
    "facebook caption bangla",
    "instagram hashtags",
    "twitter thread generator",
  ],
};

export const viewport: Viewport = {
  themeColor: "#080d14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className="dark">
      <body className="min-h-screen bg-[#080d14] text-[#f4f6f2] antialiased">
        {children}
      </body>
    </html>
  );
}

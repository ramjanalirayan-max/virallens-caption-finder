import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Syne, Hind_Siliguri, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const jet = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jet",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ViralLens AI — ছবি থেকে ভাইরাল পোস্ট ব্লুপ্রিন্ট (Gemini + Mistral)",
  description:
    "যেকোনো ছবি আপলোড করুন — Gemini বা Mistral vision brain দিয়ে গভীর বিশ্লেষণ, viral score, এবং Facebook, X (Twitter), Instagram ও LinkedIn-এর জন্য ready-to-post caption, hashtag ও strategy পান।",
};

export const viewport: Viewport = {
  themeColor: "#0b0a10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={`${syne.variable} ${hind.variable} ${jet.variable} dark`}>
      <body className="font-sans antialiased min-h-screen text-ink-100">
        <div className="app-bg" aria-hidden />
        <div className="app-noise" aria-hidden />
        {children}
      </body>
    </html>
  );
}

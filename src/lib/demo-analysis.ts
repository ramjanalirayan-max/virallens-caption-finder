import type { AnalysisResult } from "./ai-brains";

/**
 * High quality local engine. It always produces a complete, structured
 * viral package so the app never shows a dead end when a live AI key is
 * missing, out of quota, or blocked.
 */
export function generateSmartDemoAnalysis(
  userNotes?: string,
  language?: string,
  tone?: string,
  brainUsed = "gemini-2.5-flash"
): AnalysisResult {
  const notes = (userNotes || "").trim();
  const lang = (language || "").toLowerCase();
  const isBangla =
    lang.includes("bangla") ||
    lang.includes("banglish") ||
    lang.includes("mixed") ||
    (!lang && !notes);

  const topic = notes.length > 0 ? notes : "এই মুহূর্তটির গল্প";
  const brainLabel = brainUsed;

  return {
    deepAnalysis: {
      summary: `ছবিটির কম্পোজিশন, আলোর খেলা এবং রঙের সমন্বয় একে বিশেষ করে তুলেছে — "${topic}" এই কনটেক্সটকে আরো গভীর ও আবেগঘন করেছে। ফ্রেমের গভীরতা ও সাবজেক্টের অবস্থান দর্শকের চোখকে সরাসরি মূল গল্পের দিকে নিয়ে যায়, যা সোশ্যাল ফিডে স্ক্রল থামানোর জন্য অত্যন্ত কার্যকর।`,
      subjects: [
        "Primary Visual Subject",
        "Environmental / Background Layer",
        "Cinematic Natural Lighting",
        "Emotional Human Connection",
      ],
      vibeAndMood: "প্রামাণ্য, নান্দনিক এবং একইসাথে আবেগঘন — যেখানে authenticity আর aspiration দুটোই একসাথে উপস্থিত।",
      colorPalette: ["#1E293B", "#F59E0B", "#10B981", "#6366F1", "#F8FAFC"],
      lightingAndSetting:
        "সোনালি বা প্রাকৃতিক ডিফিউজড লাইট, সফট শ্যাডো ট্রানজিশন এবং সিনেম্যাটিক ডেপথ — ফলে সাবজেক্ট স্পষ্টভাবে আলাদা হয়ে দাঁড়ায়।",
      storytellingAngle:
        "নিঃশব্দ সাহস ও দৈনন্দিন সৌন্দর্যের গল্প: পারফেকশনের বদলে real moment-এর মূল্যকে তুলে ধরা।",
      emotionalHook:
        "স্মৃতি, আশা এবং নিজের জীবনের সাথে তুলনা — দর্শককে নিজের অভিজ্ঞতা কমেন্টে শেয়ার করতে উদ্দীপিত করে।",
      targetAudience: "১৮–৩৫ বছর বয়সী সোশ্যাল অ্যাক্টিভ ইউজার, ক্রিয়েটর, ভ্রমণপিপাসু ও লাইফস্টাইল এন্থুজিয়াস্ট।",
    },

    facebookOutput: {
      hookLine: isBangla
        ? "কিছু ছবি শুধু দেখা যায় না, অনুভব করা হয়... এবং এই ফ্রেমটা ঠিক তেমনই একটা। ✨"
        : "Some frames aren't just seen — they're felt. And this one hits different. ✨",
      primaryCaption: isBangla
        ? `কিছু ছবি শুধু দেখা যায় না, অনুভব করা হয়... ✨\n\nআমরা সারাদিন হাজারটা পরিকল্পনা করি, ভবিষ্যতের হিসাব কষি। কিন্তু জীবনের সবচেয়ে সেরা মুহূর্তগুলো কোনো প্ল্যান ছাড়াই তৈরি হয়ে যায়।\n\n"${topic}" — এই এক লাইনটাই আসলে পুরো ছবিটার মূল কথা। ক্যামেরা যখন শুধু একটা দৃশ্য ধরে রাখে, তখন মনের ভেতরের হাজারটা অনুভূতিও একসাথে বন্দি হয়ে যায়।\n\nআপনার জীবনেও কি এমন কোনো মুহূর্ত আছে যা দেখলেই মন ভালো হয়ে যায়? কমেন্টে জানান — পড়তে আমার ভালো লাগবে। ❤️\n\n👇 একটু ভাবুন: গত সপ্তাহে আপনার সবচেয়ে ভালো দিনটা কোনটা ছিল?`
        : `Some frames aren't just seen — they're felt. ✨\n\nWe spend so much time planning tomorrow that we forget to notice today. But the best moments of our lives are almost never scheduled.\n\n"${topic}" — that one line captures what this frame is really about. A camera doesn't just freeze a scene; it freezes a feeling.\n\nDo you have one photo that instantly lifts your mood? Tell me in the comments — I read every single one. ❤️`,
      shortPunchyCaption: isBangla
        ? "পারফেকশন নয়, উপস্থিতি — এমন মুহূর্তেই আসল গল্পটা লুকিয়ে থাকে। 🌿"
        : "Less perfection, more presence. 🌿",
      hashtags: [
        "#momentsthatmatter",
        "#reallife",
        "#storyteller",
        "#authenticvibes",
        "#positiveenergy",
        "#visualstorytelling",
        "#trendingnow",
        "#shareyourstory",
      ],
      viralStrategyTips: [
        isBangla
          ? "সন্ধ্যা ৭:৩০–৯:৩০ PM (BST) ফেসবুকে সবচেয়ে বেশি অ্যাক্টিভ সময় — এই উইন্ডোতে পোস্ট করলে প্রথম ৬০ মিনিটেই ভালো রিচ পাওয়া যায়।"
          : "Post between 7:30–9:30 PM when feed activity peaks, so the first 60-minute velocity window is strong.",
        isBangla
          ? "প্রথম ৩ মিনিটের মধ্যে নিজেই একটা কমেন্ট দিন (একটা প্রশ্ন সহ) এবং সেটি পিন করুন — এতে কমেন্ট থ্রেড শুরু হয়।"
          : "Seed your own first comment with a question and pin it — comment velocity is the strongest early signal.",
        isBangla
          ? "প্রথম ৫ জন কমেন্টারকে ১০ মিনিটের মধ্যে রিপ্লাই দিন, অ্যালগরিদম এটাকে স্ট্রং এনগেজমেন্ট সিগন্যাল ধরে।"
          : "Reply to the first five comments within ten minutes to trigger the feedback loop.",
      ],
      callToAction: isBangla
        ? "আপনার জীবনের এমন একটা প্রিয় স্মৃতি কমেন্টে শেয়ার করুন — সবচেয়ে সুন্দর উত্তরটা আমি রিপোস্ট করব! ❤️"
        : "Share one memory this frame reminds you of — I'll repost my favourite one. ❤️",
    },

    twitterOutput: {
      singleTweet: isBangla
        ? "জীবনটা পারফেক্ট হওয়ার দরকার নেই। শুধু খাঁটি আর শান্তিময় হলেই যথেষ্ট। 🕊️\n\nAgree or disagree? Quote করে বলুন।"
        : "Your life doesn't need to be perfect. It just needs to be real and peaceful. 🕊️\n\nAgree or disagree? Quote this.",
      threadTweets: [
        isBangla
          ? "১/৩ কিছু ফ্রেম কেন এত মনের মধ্যে গেঁথে যায়? কারণ এর ভেতরে কোনো কৃত্রিম শো-অফ থাকে না — থাকে পিউর রিয়েলিটি। 🧵👇"
          : "1/3 Why do candid frames hit harder than staged ones? Because real eyes recognise real presence. 🧵👇",
        isBangla
          ? "২/৩ আজকের যুগে সবাই perfection showcase করতে ব্যস্ত। রিল্যাক্সড ও authentic থাকাটাই আসল ফ্লেক্স। শান্তি খুঁজে পাওয়া একটা আর্ট।"
          : "2/3 Everyone is optimising their feed. Quiet authenticity is the rarest thing on the timeline now.",
        isBangla
          ? "৩/৩ এই ভাইবটা ভালো লাগলে বুকমার্ক করুন — যেদিন একটু শান্তি প্রয়োজন হবে, এই পোস্টটা কাজে লাগবে। ✨"
          : "3/3 If this hits, bookmark it — future you will need this calm. ✨",
      ],
      hashtags: ["#mindsetdaily", "#vibecheck", "#authenticity"],
      quoteBaitPrompt: isBangla
        ? "এক শব্দে বলুন: আপনার কাছে প্রশান্তি মানে কী?"
        : "In one word: what gives you instant peace of mind?",
      viralStrategyTips: [
        isBangla
          ? "টুইটের প্রথম লাইনটাই ৮০% সিদ্ধান্ত নেয় — সর্বোচ্চ ৯০ ক্যারেক্টারের মধ্যে সবচেয়ে শক্তিশালী লাইনটি রাখুন।"
          : "The first line decides 80% of the reach — keep the strongest claim under 90 characters.",
        isBangla
          ? "রিপ্লাইতে একটা ছোট পার্ট-২ দিন, এতে থ্রেডের এনগেজমেন্ট আরো বাড়ে।"
          : "Reply to your own tweet with a part-2 to keep the thread alive.",
      ],
    },

    instagramOutput: {
      mainCaption: isBangla
        ? `chasing peace, not perfection. 🍃\n.\n.\n"${topic}" — কিছু মুহূর্ত হৃদয়ে ছবি হয়ে থেকে যায়। ধীরে নিঃশ্বাস নিন, এখানে থাকুন।\n.\n.\n📍 এই ফ্রেমটি সেভ করে রাখুন — যেদিন একটু বিরতি প্রয়োজন হবে। 🤍\n.\n.\nআপনার ফিডে এমন কোনো ছবি আছে কি? স্টোরিতে ট্যাগ করুন!`
        : `chasing peace, not perfection. 🍃\n.\n.\n"${topic}" — some frames stay with us long after the moment is gone.\n.\n.\n📍 Save this for when you need a quiet reminder to pause. 🤍\n.\n.\nTag me in your story if this felt like you.`,
      minimalCaption: "soft frames & quiet thoughts. ✨",
      reelsHook: "POV: You finally stopped chasing noise and started chasing peace...",
      tieredHashtags: {
        highReach: ["#visualsoflife", "#explorepage", "#aestheticmoments", "#moodygrams"],
        midNiche: [
          "#visualstoryteller",
          "#candidfeed",
          "#peacefulvibes",
          "#authenticphotography",
        ],
        community: [
          "#momentkeepers",
          "#quietluxury",
          "#slowliving",
          "#chasingstillness",
        ],
      },
      aestheticTips: [
        isBangla
          ? "৪:৫ (১০৮০×১৩৫০) অনুপাতে ক্রপ করুন — মোবাইল ফিডে সবচেয়ে বেশি জায়গা ঘেঁষে নেয়।"
          : "Use a 4:5 (1080×1350) crop — it takes the most mobile feed real estate.",
        isBangla
          ? "ক্যাপশনের মাঝে ফাঁকা লাইন রাখুন — এতে পাঠ্যতা বাড়ে, লোকজন শেষ পর্যন্ত পড়ে।"
          : "Keep paragraph spacing generous — readable captions get read to the end.",
        isBangla
          ? "প্রথম ঘণ্টায় স্টোরিতে শেয়ার করুন, স্টোরি ভিউ ইনস্টাগ্রাম অ্যালগরিদমে একটা স্ট্রং সিগন্যাল।"
          : "Share to story within the first hour — story views are a strong ranking signal.",
      ],
    },

    linkedinOutput: {
      professionalCaption: isBangla
        ? `কাজের ব্যস্ততা এবং ডেডলাইনের মাঝে আমরা প্রায়ই ভুলে যাই — উচ্চ কর্মদক্ষতার জন্য ২৪ ঘণ্টা দৌড়ানো নয়, প্রয়োজন ফোকাসড বিরতি। 🎯\n\nদীর্ঘমেয়াদী সফলতার মূলে থাকে মানসিক স্পষ্টতা এবং ইচ্ছাকৃত পুনরায় চার্জ হওয়া। সেরা আইডিয়াগুলো তখনই আসে যখন আমরা একটু থেমে যাই।\n\nআপনি কীভাবে নিজের কাজের ছন্দ ঠিক রাখেন? নিচে শেয়ার করুন — আমি শিখতে চাই।`
        : `Behind every milestone there is a quiet moment of recalibration. 🎯\n\nSustainable high performance isn't about relentless hustle — it's about intentional recovery and mental clarity. The best ideas arrive when we pause.\n\nHow do you protect your focus during intense weeks? Share below — I'd love to learn.`,
      keyTakeaway: isBangla
        ? "বিশ্রাম মানে পিছিয়ে পড়া নয় — সেটাই আসল ফোকাস ফিউয়েল।"
        : "Rest isn't falling behind — it's your focus fuel.",
      hashtags: ["#productivity", "#mindset", "#leadership", "#worklifebalance"],
    },

    insights: {
      engagementScore: 86,
      shareabilityScore: 78,
      saveWorthinessScore: 72,
      viralityVerdict: isBangla
        ? "আবেগঘন ও সার্বজনীন কনটেক্সট বলে এটি শেয়ার-সেন্সিটিভ ভাইরাল পোটেনশিয়াল তৈরি করে — আসল লিভার হলো প্রথম লাইনের কিউরিওসিটি হুক।"
        : "Universal emotional context makes this highly shareable — the biggest lever is the curiosity gap in the first line.",
      abHookVariants: [
        isBangla
          ? "আপনি কি কখনো এমন ছবি দেখেছেন যা আপনাকে থামতে বাধ্য করেছে?"
          : "Ever seen a photo that physically stopped your scroll?",
        isBangla
          ? "সবাই পারফেকশন খোঁজে — আমি খুঁজেছি অসম্পূর্ণতার সৌন্দর্য।"
          : "Everyone chases perfection. I chased the beauty of imperfection instead.",
        isBangla
          ? "এই একটি ফ্রেম আমাকে এক বছরের চিন্তা থেকে বের করে এনেছে।"
          : "This single frame pulled me out of a year of overthinking.",
      ],
      trendTags: ["#2026aesthetic", "#slowliving", "#digitalwellbeing", "#storyoverstatus"],
      seoKeywords: [
        "candid photography caption",
        "peaceful moment quotes",
        "instagram caption ideas bangla",
        "viral facebook post ideas",
      ],
      bestTimeToPost: [
        "Facebook: সোম–বৃহস্পতি, রাত ৭:৩০–৯:৩০ PM (BST) — ফ্যামিলি ও ফ্রেন্ড গ্রুপে শেয়ার পিক",
        "X (Twitter): রবি–মঙ্গল, রাত ৯:০০–১১:০০ PM — কনভারসেশন ও কোট-টুইট পিক",
        "Instagram: শুক্র–শনি, দুপুর ১২:০০–২:০০ PM ও রাত ৮:০০–১০:০০ PM — সেভ ও স্টোরি শেয়ার পিক",
      ],
      contentPillars: ["Authentic Storytelling", "Mindset & Calm", "Visual Storytelling"],
      carouselStoryboard: [
        "Slide 1: থামানো হুক — ছোট টেক্সট ওভারলে সহ ছবিটি",
        "Slide 2: সমস্যাটা তুলে ধরা — কেন আমরা এত ব্যস্ত",
        "Slide 3: মোড় — এই মুহূর্তে যা শিখলাম",
        "Slide 4: প্র্যাকটিক্যাল ৩টি ধাপ যা দর্শক আজই করতে পারে",
        "Slide 5: CTA — সেভ করুন ও কমেন্টে নিজের গল্প জানান",
      ],
      audiencePainPoints: [
        "দৈনন্দিন ব্যস্ততায় শান্তি হারিয়ে যাওয়া",
        "সোশ্যাল মিডিয়ায় authenticity আর প্রেশারের দ্বন্দ্ব",
      ],
      riskNotes: isBangla
        ? "অতিরিক্ত জেনেরিক হ্যাশট্যাগ এড়িয়ে চলুন; কোনো মেডিকেল/ফিন্যান্সিয়াল দাবি না করলেই ভালো।"
        : "Avoid over-broad spam hashtags; don't make medical or financial claims in the caption.",
    },
  };
}

/** Used by the API route as the canonical fallback template. */
export const DEMO_BRAIN_LABEL = "local-viral-engine";

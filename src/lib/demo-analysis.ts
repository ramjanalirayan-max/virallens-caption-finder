import type { AnalysisResult, StrategyOutput } from "./types";

/* Curated pools used to top-up thin hashtag lists coming back from a model */
export const HASHTAG_POOLS = {
  facebook: [
    "#ViralPost",
    "#TrendingNow",
    "#LifeMoments",
    "#Storytelling",
    "#BanglaVibes",
    "#DailyLife",
    "#Explore",
    "#Memories",
    "#GoodVibes",
    "#Dhaka",
    "#Bangladesh",
    "#PhotoOfTheDay",
  ],
  twitter: ["#VibeCheck", "#Photography", "#Life", "#Mood"],
  igHigh: ["#explorepage", "#photooftheday", "#instagood", "#reels", "#viral", "#aesthetic"],
  igMid: [
    "#visualstoryteller",
    "#moodygrams",
    "#candidfeed",
    "#bangladeshiphotographers",
    "#dhakagram",
    "#streetsofdhaka",
    "#peacefulvibes",
    "#visualsoflife",
  ],
  igCommunity: [
    "#momentkeepers",
    "#quietluxury",
    "#aestheticlifestyle",
    "#creatorsofbangladesh",
    "#banglacreators",
    "#frameworthy",
  ],
  linkedin: ["#Leadership", "#Creativity", "#Mindset", "#PersonalBranding", "#Storytelling"],
};

type Archetype = "travel" | "food" | "tech" | "portrait";

function detectArchetype(notes = ""): Archetype {
  const n = notes.toLowerCase();
  if (/(sunset|mountain|sea|beach|hill|sajek|cox|bandarban|rain|monsoon|travel|trip|nature|sky|valley|পাহাড়|সমুদ্র|ভ্রমণ|সাজেক|বৃষ্টি)/.test(n)) return "travel";
  if (/(chai|tea|coffee|cafe|food|biryani|kacchi|dinner|lunch|street food|চা|খাবার|বিরিয়ানি|কফি)/.test(n)) return "food";
  if (/(code|coding|desk|startup|launch|office|laptop|product|dev|build|design|কাজ|অফিস|স্টার্টআপ)/.test(n)) return "tech";
  return "portrait";
}

const ARCHETYPE_META: Record<
  Archetype,
  { subjects: string[]; palette: string[]; pillars: string[]; summary: string; light: string; composition: string; audience: string; format: string }
> = {
  travel: {
    subjects: ["Open landscape", "Horizon & sky gradient", "Natural leading lines", "Human-scale presence"],
    palette: ["#1B2A41", "#F4A261", "#E9C46A", "#2A9D8F", "#F1FAEE"],
    pillars: ["Travel", "Nature", "Slow living", "Escape"],
    summary:
      "A wide, atmospheric travel frame where sky and horizon carry the emotion. The scale of the scene versus the viewer creates instant 'I want to be there' pull — the single strongest share trigger for travel content.",
    light: "Soft directional golden-hour light with long warm shadows and a cool-toned sky, giving natural depth without heavy editing.",
    composition: "Horizon sits near the lower third, leaving generous negative space above — ideal for text overlays and a clean 4:5 crop.",
    audience: "Travel dreamers 20-38, weekend explorers, hill-track & sea lovers in Bangladesh and the wider South Asian diaspora.",
    format: "Full-bleed 4:5 feed photo + 6s Reel with slow push-in and ambient audio",
  },
  food: {
    subjects: ["Hero food/drink item", "Warm table setting", "Steam / texture detail", "Cozy ambient context"],
    palette: ["#3B2416", "#C9782F", "#F2D7B6", "#8A4B2A", "#1F1F1F"],
    pillars: ["Food", "Comfort", "Nostalgia", "Everyday joy"],
    summary:
      "An intimate food frame that sells feeling over product — warmth, steam, texture and a lived-in table. Comfort food imagery scores high on saves and 'tag a friend' behaviour.",
    light: "Warm tungsten-leaning ambient light with soft falloff; highlights on the rim of the cup/plate give the image its appetite appeal.",
    composition: "Tight 45° angle with shallow depth of field keeps the hero item sharp while the background melts into mood.",
    audience: "Foodies and cozy-lifestyle scrollers 18-40, chai/coffee culture communities, late-evening Facebook browsers.",
    format: "Square feed photo + Story with poll sticker ('চা না কফি?')",
  },
  tech: {
    subjects: ["Workspace / device setup", "Screen glow", "Minimal desk objects", "Focused working mood"],
    palette: ["#0F172A", "#38BDF8", "#A78BFA", "#1E293B", "#F8FAFC"],
    pillars: ["Builder life", "Productivity", "Tech", "Hustle with balance"],
    summary:
      "A clean builder/workspace frame with strong screen glow and minimal clutter. Setup content performs through aspiration — people save it as a reference and comment on gear.",
    light: "Cool monitor glow against a dim room, with a warm accent lamp balancing skin/desk tones — classic 'late-night build' palette.",
    composition: "Centered symmetry with the screen as focal point; foreground objects frame the shot and add depth.",
    audience: "Developers, designers, students and founders 18-35 — LinkedIn and X heavy, Instagram save-driven.",
    format: "Carousel (setup → detail → the thing you shipped) + X thread",
  },
  portrait: {
    subjects: ["Human subject / expression", "Ambient background context", "Natural light on skin", "Candid body language"],
    palette: ["#1E293B", "#F59E0B", "#10B981", "#6366F1", "#F5F5F4"],
    pillars: ["Authenticity", "Moments", "Self-expression", "Storytelling"],
    summary:
      "A candid, human-led frame where expression and posture do the talking. Faces remain the strongest scroll-stopper on every feed, and the natural light here reads as real rather than staged.",
    light: "Soft diffused natural light with gentle directional shaping; skin tones stay true and the background falls into a calm ambient wash.",
    composition: "Subject placed slightly off-centre with breathing room in the direction of gaze — a tighter crop would intensify the emotion on mobile.",
    audience: "Story-loving scrollers 18-35, creators and friends-of-the-subject — the group most likely to comment and share.",
    format: "4:5 feed photo + 5s Reel with slow zoom and a trending calm audio",
  },
};

function toneHooks(tone = "", isBangla: boolean, archetype: Archetype): { hook: string; verdict: string } {
  const t = tone.toLowerCase();
  if (t.includes("funny") || t.includes("meme")) {
    return {
      hook: isBangla ? "আমি: আজ productive হবো। আমার ছবি: 📸 ফ্রেমে পোজ দিচ্ছে 😌" : "Me: today I'll be productive. Also me: posing for this frame 😌",
      verdict: "Meme-ready framing — relatability will drive comments faster than aesthetics.",
    };
  }
  if (t.includes("professional") || t.includes("inspiring")) {
    return {
      hook: isBangla ? "সবচেয়ে বড় কাজগুলো সবসময় নীরবে শুরু হয়।" : "The biggest things always start quietly.",
      verdict: "Insight-led framing — strongest on LinkedIn and as a Facebook storytelling post.",
    };
  }
  if (t.includes("emotional") || t.includes("heartfelt")) {
    return {
      hook: isBangla ? "কিছু মুহূর্ত ক্যামেরায় না, মনে বন্দি হয়ে যায়। 🤍" : "Some moments don't get captured by the camera — they get captured by the heart. 🤍",
      verdict: "Emotional pull is the lead signal — build the caption around memory and belonging.",
    };
  }
  if (t.includes("storyteller") || t.includes("aesthetic")) {
    return {
      hook: isBangla ? "আলোটা ঠিক তখনই এলো, যখন কেউ দেখছিল না।" : "The light arrived exactly when no one was looking.",
      verdict: "Aesthetic storytelling angle — let the caption breathe with short lines and white space.",
    };
  }
  const byArch: Record<Archetype, [string, string]> = {
    travel: ["কিছু জায়গা কোনো কথা না বলেই আপনাকে ঠিক করে দেয়। 🌄", "Some places fix you without saying a word. 🌄"],
    food: ["এক কাপ চা, আর পুরো দিনটা অন্যরকম। ☕", "One cup, and the whole day changes. ☕"],
    tech: ["রাত ২টা। স্ক্রিনের আলো। আর একটা আইডিয়া যেটা ঘুমাতে দিচ্ছে না। 💻", "2 AM. Screen glow. And one idea that won't let me sleep. 💻"],
    portrait: ["কিছু ছবি কোনো ফিল্টারের অপেক্ষা রাখে না, মুহূর্তটাই যথেষ্ট কথা বলে দেয়। ✨", "Some frames don't need a filter — the moment does all the talking. ✨"],
  };
  return {
    hook: isBangla ? byArch[archetype][0] : byArch[archetype][1],
    verdict: "Strong thumb-stop potential — lead with the hook line and ask a comment-bait question.",
  };
}

export function buildDefaultStrategy(
  partial: Partial<StrategyOutput> = {},
  archetype: Archetype = "portrait",
  hook = ""
): StrategyOutput {
  const meta = ARCHETYPE_META[archetype];
  const base: StrategyOutput = {
    viralScore: 64,
    scoreBreakdown: { visualImpact: 68, emotionalPull: 62, shareability: 60, trendFit: 66 },
    verdict: "Solid organic potential — the caption hook and first-hour engagement will decide reach.",
    bestPostingTimes: {
      facebook: "Tue–Thu 8:00–10:00 PM BST (evening scroll peak)",
      twitter: "Weekdays 9:00–11:00 AM & 9:00 PM BST",
      instagram: "Fri 7:00–9:00 PM & Sun 11:00 AM BST",
    },
    recommendedFormat: meta.format,
    hookVariants: hook ? [hook] : [],
    imageImprovementTips: [
      "Crop to 4:5 (1080×1350) so the frame fills the mobile screen.",
      "Lift shadows by ~10% and keep highlights natural — avoid heavy saturation.",
      "Leave the top 20% clean if you plan a text overlay for Reels/Stories.",
    ],
    trendAlignment:
      "Rides the 2026 'real over produced' wave: natural light, candid framing and short, specific captions outperform glossy, over-edited posts.",
    contentPillars: meta.pillars,
    firstCommentStrategy:
      "Post your own first comment within 2 minutes with a question or a behind-the-scene detail; reply to every early comment to trigger the ranking loop.",
  };
  return {
    ...base,
    ...partial,
    scoreBreakdown: { ...base.scoreBreakdown, ...(partial.scoreBreakdown || {}) },
    bestPostingTimes: { ...base.bestPostingTimes, ...(partial.bestPostingTimes || {}) },
    hookVariants: partial.hookVariants?.length ? partial.hookVariants : base.hookVariants,
    imageImprovementTips: partial.imageImprovementTips?.length ? partial.imageImprovementTips : base.imageImprovementTips,
    contentPillars: partial.contentPillars?.length ? partial.contentPillars : base.contentPillars,
  };
}

/**
 * Context-aware local engine: used as the fallback template for model output
 * (fills any field the model forgot) and as the instant demo mode.
 */
export function generateSmartDemoAnalysis(
  userNotes = "",
  language = "Bangla / Banglish",
  tone = "Viral & Catchy",
  brainUsed = "gemini-2.5-flash"
): AnalysisResult {
  const lang = (language || "").toLowerCase();
  const isBangla = !lang || lang.includes("bangla") || lang.includes("banglish") || lang.includes("mixed");
  const archetype = detectArchetype(userNotes);
  const meta = ARCHETYPE_META[archetype];
  const { hook, verdict } = toneHooks(tone, isBangla, archetype);
  const contextLine = userNotes?.trim()
    ? isBangla
      ? `প্রসঙ্গ: ${userNotes.trim()}`
      : `Context: ${userNotes.trim()}`
    : "";

  const fbBody = isBangla
    ? `${hook}\n\nআমরা সারাদিন কত প্ল্যান করি, ভবিষ্যতের হাজারটা হিসাব কষি। অথচ দিনশেষে সবচেয়ে সেরা মুহূর্তগুলো কোনো প্ল্যান ছাড়াই তৈরি হয়ে যায়।\n\nএই ফ্রেমটা শুধু একটা দৃশ্য না — এটা একটা অনুভূতি, এক চিমটি শান্তি, আর এক টুকরো সময় যেটা আর কখনো ঠিক এভাবে ফিরে আসবে না।${contextLine ? `\n\n${contextLine}` : ""}\n\nআপনার ফোনে এমন কোন ছবিটা আছে যেটা দেখলেই মন ভালো হয়ে যায়? কমেন্টে বলুন, আমি সবগুলো পড়বো। ❤️`
    : `${hook}\n\nWe spend all day planning tomorrow, running a thousand calculations. Yet the moments that stay with us are almost never the ones we scheduled.\n\nThis frame isn't just a scene — it's a feeling, a small pocket of calm, a slice of time that won't return in quite this shape again.${contextLine ? `\n\n${contextLine}` : ""}\n\nWhich photo on your phone instantly lifts your mood? Tell me below — I'm reading every one. ❤️`;

  const igBody = isBangla
    ? `${hook}\n\nআমরা সবাই দৌড়াতে খুব ভালো, কিন্তু থামতে ভুলে যাই।\nএই ফ্রেমটা আমাকে মনে করিয়ে দিয়েছে — থামাটাও আসলে একটা skill।\n\nকোনো filter না, কোনো বড় প্ল্যান না।\nশুধু আলোটা ঠিক ছিল, আর মনটা ছিল সত্যিকারের উপস্থিত।\n\nপ্রতিদিন এমন কয়টা মুহূর্ত আমরা চোখের সামনে দিয়ে হারিয়ে ফেলি, খেয়ালই করি না। আজ হয়তো একটা থামার দিন।\n\n🔖 Save করে রাখুন — যেদিন একটা quiet reminder দরকার হবে।\n💬 আপনার peace-এর জায়গা কোনটা? কমেন্টে বলুন 👇`
    : `${hook}\n\nWe are all good at running, and terrible at stopping.\nThis frame reminded me that pausing is a skill too.\n\nNo filter. No big plan.\nJust the right light, and a mind that was genuinely present.\n\nMost days we walk past a dozen moments exactly like this one without ever noticing. Today felt like a good day to stop.\n\n🔖 Save this for the day you need a quiet reminder.\n💬 Where's your peace place? Tell me below 👇`;

  const strategy = buildDefaultStrategy(
    {
      verdict,
      hookVariants: isBangla
        ? [hook, "এই ছবিটা দেখে প্রথম যে কথাটা মাথায় এলো...", "সত্যি বলতে, এই মুহূর্তটার জন্য কোনো ক্যাপশন হয় না।"]
        : [hook, "The first thing that came to mind when I saw this frame...", "Honestly, no caption does this moment justice."],
    },
    archetype,
    hook
  );

  return {
    deepAnalysis: {
      summary: meta.summary,
      subjects: meta.subjects,
      vibeAndMood: isBangla
        ? "Authentic, nostalgic yet modern — a calm frame with real emotional pull."
        : "Authentic, nostalgic yet modern — a calm frame with real emotional pull.",
      colorPalette: meta.palette,
      lightingAndSetting: meta.light,
      storytellingAngle: "Raw authenticity over staged perfection: the quiet courage inside an ordinary moment.",
      emotionalHook: "Relatability and introspection — it makes the viewer pause and think about their own version of this moment.",
      targetAudience: meta.audience,
      compositionNotes: meta.composition,
      textInImage: "None detected",
      culturalContext: "Reads naturally for Bangladeshi / South Asian audiences while staying globally relatable.",
      thumbStopFactor: "Strong single focal point + warm light = instant pause in the feed.",
    },
    facebookOutput: {
      hookLine: hook,
      primaryCaption: fbBody,
      shortPunchyCaption: isBangla
        ? "শান্তির খোঁজ বাইরে না — এমন ছোট ছোট মুহূর্তের মাঝেই লুকিয়ে থাকে। 🌿"
        : "Less perfection, more presence. Peace hides in moments like this. 🌿",
      hashtags: [
        "#LifeMoments",
        "#AuthenticVibes",
        "#Storytelling",
        "#BanglaVibes",
        "#DailyLife",
        "#Memories",
        "#GoodVibes",
        "#Bangladesh",
        "#PhotoOfTheDay",
        "#TrendingNow",
      ],
      viralStrategyTips: [
        "Post between 8:00–10:00 PM BST; reach compounds in the first 60 minutes.",
        "Pin your own question comment within 2 minutes and reply to the first 10 commenters.",
        "Share to 2–3 relevant groups 2 hours later with a one-line personal intro (not the same caption).",
        "No external links in the post body — put links in the first comment.",
      ],
      callToAction: isBangla
        ? "আপনার জীবনের এমন একটা মুহূর্ত কোনটা? কমেন্টে জানাবেন?"
        : "Which moment from your week made you smile? Tell me below!",
      firstComment: isBangla
        ? "এই ছবির পেছনের গল্পটা জানতে চাইলে comment এ 'গল্প' লিখুন 👀"
        : "Want the story behind this frame? Comment 'story' 👀",
    },
    twitterOutput: {
      singleTweet: isBangla
        ? "জীবনটা perfect হওয়ার দরকার নেই — শুধু খাঁটি আর শান্তিময় হলেই যথেষ্ট। 🕊️\n\nAgree?"
        : "You don't need a perfect life. Just peaceful moments and genuine people. 🕊️\n\nAgree?",
      threadTweets: isBangla
        ? [
            "1/3 কিছু ফ্রেম কেন এত মনে গেঁথে যায়? কারণ এর ভেতরে কোনো show-off থাকে না — থাকে pure reality। 🧵",
            "2/3 সবাই যখন perfection দেখাতে ব্যস্ত, তখন relaxed থাকাটাই সবচেয়ে বড় flex। শান্তি খুঁজে পাওয়া একটা art।",
            "3/3 এই vibe ভালো লাগলে bookmark করুন আর যাকে দরকার তাকে পাঠিয়ে দিন। ✨",
          ]
        : [
            "1/3 Why do candid frames hit harder than staged ones? Because real eyes recognise real presence. 🧵",
            "2/3 In a feed full of perfection, staying relaxed is the loudest flex. Finding peace is a skill.",
            "3/3 If this frame slowed your scroll, bookmark it and send it to someone who needs a breather. ✨",
          ],
      hashtags: ["#VibeCheck", "#Mindset"],
      quoteBaitPrompt: isBangla ? "এক শব্দে: আপনার কাছে শান্তি মানে কী?" : "One word: what does peace mean to you?",
      viralStrategyTips: [
        "Single line breaks only — X rewards fast mobile reading.",
        "Keep the tweet under 240 chars so quote tweets don't truncate it.",
        "Quote-tweet yourself 24h later with the story behind the frame.",
      ],
      altText: "A calm, naturally lit photo with a single clear subject and soft ambient background.",
    },
    instagramOutput: {
      mainCaption: igBody,
      minimalCaption: isBangla ? "soft frames, quiet thoughts. ✨" : "soft frames, quiet thoughts. ✨",
      reelsHook: isBangla ? "POV: আপনি finally noise-এর বদলে peace বেছে নিলেন" : "POV: you finally chose peace over noise",
      tieredHashtags: {
        highReach: ["#explorepage", "#photooftheday", "#aesthetic", "#reels", "#instagood"],
        midNiche: ["#visualstoryteller", "#moodygrams", "#candidfeed", "#bangladeshiphotographers", "#dhakagram", "#peacefulvibes", "#visualsoflife"],
        community: ["#momentkeepers", "#aestheticlifestyle", "#creatorsofbangladesh", "#banglacreators", "#frameworthy"],
      },
      aestheticTips: [
        "Use a 4:5 crop (1080×1350) for maximum feed real estate.",
        "Post the same frame as a 5–6s Reel with slow zoom + trending calm audio for 5–10× reach.",
        "Put hashtags in the first comment to keep the caption clean.",
      ],
      carouselIdea: "Slide 1: the frame · Slide 2: a tighter crop/detail · Slide 3: the hook line as text on a plain background · Slide 4: 'save this' CTA.",
      altText: "A naturally lit, calm photograph with one clear subject and a soft, atmospheric background.",
    },
    linkedinOutput: {
      professionalCaption: isBangla
        ? `কাজের ব্যস্ততা আর deadline-এর মাঝে আমরা প্রায়ই ভুলে যাই — মস্তিষ্ক reload করার জন্যও 'pause' বোতামটা চাপতে হয়। 🎯\n\nবড় ফলাফল পেতে ২৪ ঘণ্টা নন-স্টপ দৌড়ানো লাগে না; লাগে সঠিক focus আর মানসিক ভারসাম্য।\n\nআপনি কীভাবে নিজের work-life balance ধরে রাখেন?`
        : `Behind every milestone there's a quiet moment of reflection. 🎯\n\nIn an era of relentless hustle, intentional pauses aren't lost momentum — they're how you calibrate focus for long-term impact.\n\nHow do you recharge during high-intensity weeks?`,
      keyTakeaway: "Sustainable high performance starts with intentional mental clarity.",
      hashtags: ["#Productivity", "#Mindset", "#WorkLifeBalance", "#Leadership"],
    },
    strategy,
  };
}

/** Ensures legacy rows (saved before strategy existed) still render fully */
export function ensureStrategy(result: Partial<AnalysisResult>, hook = ""): AnalysisResult {
  const base = generateSmartDemoAnalysis();
  return {
    deepAnalysis: { ...base.deepAnalysis, ...(result.deepAnalysis || {}) },
    facebookOutput: { ...base.facebookOutput, ...(result.facebookOutput || {}) },
    twitterOutput: { ...base.twitterOutput, ...(result.twitterOutput || {}) },
    instagramOutput: {
      ...base.instagramOutput,
      ...(result.instagramOutput || {}),
      tieredHashtags: {
        ...base.instagramOutput.tieredHashtags,
        ...(result.instagramOutput?.tieredHashtags || {}),
      },
    },
    linkedinOutput: { ...base.linkedinOutput, ...(result.linkedinOutput || {}) },
    strategy: buildDefaultStrategy(result.strategy || {}, "portrait", hook || result.facebookOutput?.hookLine || ""),
  };
}

export const DEMO_BRAIN_LABEL = (brain: string) => `local-viral-engine (${brain})`;

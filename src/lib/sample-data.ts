export interface SampleImage {
  id: string;
  title: string;
  category: string;
  url: string;
  notes: string;
  suggestedTone: string;
  suggestedLanguage: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "travel-sunset",
    title: "Golden Hour Mountain Valley",
    category: "Travel & Nature",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    notes: "Sunset view during mountain journey, peaceful evening breeze, serene reflections",
    suggestedTone: "Storyteller & Aesthetic 🌿",
    suggestedLanguage: "Bangla / Banglish",
  },
  {
    id: "street-chai",
    title: "Monsoon Chai & Rainy Vibe",
    category: "Culture & Lifestyle",
    url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80",
    notes: "Hot cup of tea on a rainy evening, comforting cozy memories, nostalgia with friends",
    suggestedTone: "Emotional & Heartfelt ❤️",
    suggestedLanguage: "Bangla / Banglish",
  },
  {
    id: "tech-desk",
    title: "Minimalist Developer Setup",
    category: "Tech & Work",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
    notes: "Late night coding session, building ambitious products, deep focus and coffee",
    suggestedTone: "Viral & Catchy 🔥",
    suggestedLanguage: "English",
  },
  {
    id: "candid-portrait",
    title: "Cinematic Urban Portrait",
    category: "Fashion & Mood",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
    notes: "Golden hour urban portrait, confident gaze, aesthetic color contrast",
    suggestedTone: "Viral & Catchy 🔥",
    suggestedLanguage: "Bangla / Banglish",
  },
];

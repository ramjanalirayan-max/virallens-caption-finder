"use client";

export interface PreparedImage {
  /** Full (compressed) data URL ready to preview and analyze */
  dataUrl: string;
  /** Base64 WITHOUT the data: prefix, sent to the API */
  base64: string;
  mimeType: string;
  /** Small JPEG thumbnail data URL for history storage */
  thumbnail: string;
  width: number;
  height: number;
  sizeKb: number;
  originalSizeKb: number;
  fileName: string;
}

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.86;
const THUMB_DIMENSION = 420;
const THUMB_QUALITY = 0.7;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ছবিটি লোড করা সম্ভব হয়নি। অন্য একটি ছবি চেষ্টা করুন।"));
    img.src = src;
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const naturalWidth = img.naturalWidth || img.width || 800;
  const naturalHeight = img.naturalHeight || img.height || 600;
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ব্রাউজার ক্যানভাস সাপোর্ট করছে না।");

  // White background so transparent PNGs don't turn black in JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, width, height };
}

function stripPrefix(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
}

function estimateKb(base64: string): number {
  return Math.round(((base64.length * 3) / 4 / 1024) * 10) / 10;
}

/**
 * Compresses any image (File or URL/data-URL) down to a safe payload size for
 * vision APIs (max 1400px, JPEG). Also creates a tiny thumbnail for history.
 */
export async function prepareImageFromSrc(
  src: string,
  fileName = "image.jpg",
  originalSizeKb = 0
): Promise<PreparedImage> {
  const img = await loadImage(src);

  let main = drawToCanvas(img, MAX_DIMENSION);
  let dataUrl = main.canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  // If the source was already a small, supported format keep the original data-URL
  if (src.startsWith("data:image/") && originalSizeKb > 0 && originalSizeKb < 220) {
    const originalBase64 = stripPrefix(src);
    if (estimateKb(originalBase64) <= estimateKb(stripPrefix(dataUrl))) {
      dataUrl = src;
    }
  }

  // Second (and third) pass so the API payload always stays well under limits
  let base64 = stripPrefix(dataUrl);
  if (estimateKb(base64) > 1050) {
    main = drawToCanvas(img, 1180);
    dataUrl = main.canvas.toDataURL("image/jpeg", 0.8);
    base64 = stripPrefix(dataUrl);
  }
  if (estimateKb(base64) > 1050) {
    main = drawToCanvas(img, 900);
    dataUrl = main.canvas.toDataURL("image/jpeg", 0.68);
    base64 = stripPrefix(dataUrl);
  }

  const thumb = drawToCanvas(img, THUMB_DIMENSION);
  const thumbnail = thumb.canvas.toDataURL("image/jpeg", THUMB_QUALITY);

  return {
    dataUrl,
    base64,
    mimeType: dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg",
    thumbnail,
    width: main.width,
    height: main.height,
    sizeKb: estimateKb(base64),
    originalSizeKb: originalSizeKb || estimateKb(base64),
    fileName,
  };
}

export function prepareImageFromFile(file: File): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const prepared = await prepareImageFromSrc(
          reader.result as string,
          file.name,
          Math.round(file.size / 1024)
        );
        resolve(prepared);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ফাইলটি পড়া সম্ভব হয়নি।"));
    reader.readAsDataURL(file);
  });
}

export async function prepareImageFromUrl(
  url: string,
  fileName = "sample.jpg"
): Promise<PreparedImage> {
  // Loaded directly by the browser (Unsplash allows CORS) so we never need a proxy
  return prepareImageFromSrc(url, fileName, 0);
}

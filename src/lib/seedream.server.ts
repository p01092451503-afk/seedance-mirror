// Seedream(BytePlus Ark) 호출 및 해상도 매핑 — 원본 server.js 로직 그대로 이식
const SEEDREAM_MIN_PIXELS = 3686400;
const SEEDREAM_TARGET_PIXELS = 3840 * 2160;

function roundUpTo16(n: number) {
  return Math.max(16, Math.ceil(Number(n) / 16) * 16);
}

function normalizeSeedreamSize(width: number, height: number) {
  let w = roundUpTo16(width);
  let h = roundUpTo16(height);

  if (w * h < SEEDREAM_MIN_PIXELS) {
    const scale = Math.sqrt(SEEDREAM_MIN_PIXELS / (w * h));
    w = roundUpTo16(w * scale);
    h = roundUpTo16(h * scale);
  }

  while (w * h < SEEDREAM_MIN_PIXELS) {
    if (w >= h) w += 16;
    else h += 16;
  }

  return `${w}x${h}`;
}

function ratioToSeedreamSize(wRatio: number, hRatio: number) {
  const width = Math.sqrt((SEEDREAM_TARGET_PIXELS * wRatio) / hRatio);
  const height = Math.sqrt((SEEDREAM_TARGET_PIXELS * hRatio) / wRatio);
  return normalizeSeedreamSize(width, height);
}

export function aspectRatioToSize(aspectRatio?: string) {
  const raw = String(aspectRatio || "").trim();

  const map: Record<string, string> = {
    "9:16": "2160x3840",
    "16:9": "3840x2160",
    "3:4": "2496x3328",
    "4:3": "3328x2496",
    "2:3": "2352x3528",
    "3:2": "3528x2352",
    "1:1": "2880x2880",
    "4:5": "2560x3200",
    "5:4": "3200x2560",
  };
  if (map[raw]) return map[raw];

  const explicit = raw.match(/^(\d{3,5})x(\d{3,5})$/i);
  if (explicit) return normalizeSeedreamSize(Number(explicit[1]), Number(explicit[2]));

  const ratio = raw.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (ratio) {
    const wRatio = Number(ratio[1]);
    const hRatio = Number(ratio[2]);
    if (wRatio > 0 && hRatio > 0) return ratioToSeedreamSize(wRatio, hRatio);
  }
  return "2K";
}

export function getArkEndpointId() {
  return process.env["ARK_ENDPOINT_ID"] || process.env["ARK_ENDPOINT"] || process.env["ARK_MODEL"] || "";
}

export function getArkBaseUrl() {
  return process.env["ARK_BASE_URL"] || "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
}

function isPlaceholder(value?: string) {
  return !value || /your_|example|replace_me/i.test(String(value));
}

export function validateEnv() {
  if (isPlaceholder(process.env["ARK_API_KEY"])) return "ARK_API_KEY가 설정되지 않았습니다.";
  if (isPlaceholder(getArkEndpointId())) return "ARK_ENDPOINT_ID가 설정되지 않았습니다.";
  return null;
}

export function makePayload({
  prompt,
  images,
  size = "2K",
  aspectRatio,
  watermark = false,
}: {
  prompt: string;
  images?: unknown;
  size?: string | undefined;
  aspectRatio?: string | undefined;
  watermark?: boolean | undefined;
}) {
  const filteredImages = Array.isArray(images)
    ? images.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
    : [];
  return {
    model: getArkEndpointId(),
    // 프롬프트는 어떠한 가공도 없이 그대로 전달한다.
    prompt,
    image: filteredImages,
    sequential_image_generation: "auto",
    sequential_image_generation_options: { max_images: 1 },
    response_format: "url",
    size: aspectRatio ? aspectRatioToSize(aspectRatio) : size,
    stream: false,
    watermark,
  };
}

export async function callSeedream(payload: unknown) {
  const res = await fetch(getArkBaseUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["ARK_API_KEY"]}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { rawText: text };
  }
  if (!res.ok) {
    const err = new Error(`Seedream API error: HTTP ${res.status}`) as Error & {
      status?: number;
      detail?: unknown;
    };
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

export function extractUrls(raw: unknown): string[] {
  const found: string[] = [];
  function walk(v: unknown) {
    if (!v) return;
    if (typeof v === "string") {
      if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:image")) found.push(v);
      return;
    }
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
  }
  walk(raw);
  return [...new Set(found)];
}

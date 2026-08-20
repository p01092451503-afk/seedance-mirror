// V21.7 프롬프트 빌더 — 원본 App.jsx 로직 그대로 이식
import type { ConfigItem, PromptConfig } from "./prompt-config";

export type Figure = {
  figNo: number;
  type: "charA" | "charB" | "bg" | "pose" | "style";
  label: string;
  filename?: string;
};

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

export async function readImageFromClipboard(): Promise<string> {
  if (!navigator.clipboard?.read) throw new Error("이 환경에서 클립보드 이미지 읽기를 지원하지 않습니다.");
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const imageType = item.types.find((t) => t.startsWith("image/"));
    if (!imageType) continue;
    const blob = await item.getType(imageType);
    return await fileToDataUrl(blob);
  }
  throw new Error("클립보드에 이미지가 없습니다. 이미지를 먼저 복사해주세요.");
}

export function sanitizePrompt(text: string) {
  if (!text) return text;
  let result = String(text);
  result = result.replace(/^\s*`{3,}\s*[a-zA-Z0-9_-]*\s*\r?\n?/gm, "");
  result = result.replace(/^\s*'{3,}\s*[a-zA-Z0-9_-]*\s*\r?\n?/gm, "");
  result = result.replace(/^\s*`{3,}\s*$/gm, "");
  result = result.replace(/^\s*'{3,}\s*$/gm, "");
  result = result.replace(/`{3,}/g, "");
  result = result.replace(/'{3,}/g, "");
  result = result.replace(/^[ \t]*>[ \t]?/gm, "");
  result = result.replace(/\r\n/g, "\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

export function insertTextAtSelection(
  current: string,
  insertText: string,
  selectionStart: number | null,
  selectionEnd: number | null,
) {
  const text = String(current || "");
  const start = Number.isInteger(selectionStart) ? (selectionStart as number) : text.length;
  const end = Number.isInteger(selectionEnd) ? (selectionEnd as number) : start;
  return text.slice(0, start) + insertText + text.slice(end);
}

export function checkFigureN(text: string) {
  return /\bFigure\s*(?:N|X|\?|\[[^\]]+\]|\{[^}]+\})/i.test(text);
}

function normalizePromptText(text: string) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export function checkActionMissing(finalPrompt: string, actionText: string) {
  const action = normalizePromptText(actionText);
  if (!action) return false;
  const finalText = normalizePromptText(finalPrompt);
  const probeLength = Math.min(60, Math.max(20, action.length));
  const probe = action.slice(0, probeLength);
  return !finalText.includes(probe);
}

export function resolveFigureRoleText(text: string, charA?: Figure, charB?: Figure) {
  if (!text) return text;
  const a = charA ? `the Figure ${charA.figNo} character` : "the Figure 1 character";
  const b = charB ? `the Figure ${charB.figNo} character` : "the Figure 2 character";
  return String(text)
    .replace(/\bthe first character\b/gi, "the Figure 1 character")
    .replace(/\bthe second character\b/gi, "the Figure 2 character")
    .replace(/\bfirst character\b/gi, "Figure 1 character")
    .replace(/\bsecond character\b/gi, "Figure 2 character")
    .replace(/over Character A's shoulder/gi, `over the shoulder of ${a}`)
    .replace(/over Character B's shoulder/gi, `over the shoulder of ${b}`)
    .replace(/at Character A's side/gi, `at the side of ${a}`)
    .replace(/at Character B's side/gi, `at the side of ${b}`)
    .replace(/Character A's/gi, `${a}'s`)
    .replace(/Character B's/gi, `${b}'s`)
    .replace(/Character A/gi, a)
    .replace(/Character B/gi, b);
}

export function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (e) {
    console.warn("Chime failed:", e);
  }
}

export function downloadImage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = `/api/download-image?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function wordCount(text: string) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export type WorkState = ReturnType<typeof makeWork>;

export function makeWork(id: number) {
  return {
    id,
    name: `Work ${id}`,
    status: "empty" as "empty" | "ready" | "running" | "done" | "error",
    elapsed: 0,
    completedText: "",
    batchProgress: "",
    selectedCharacterIds: ["", ""] as string[],
    charAPrimaryIndex: 0,
    charBPrimaryIndex: 0,
    focusChar: "A",
    poseRef: { url: "", preview: "" },
    backgroundRef: { url: "", preview: "" },
    styleRef: { enabled: false, selectedStyleId: "" },
    poseStrengthId: "POS_003",
    bgStrengthId: "BG_003",
    viewCompositionId: "",
    emotionId: "EMO_000",
    styleFinishId: "STY_001",
    actionText: "",
    directionMemo: "",
    isPhotopose: false,
    bgStyleId: "BGS_000",
    costumeModeId: "CST_000",
    bodySourceId: "BDY_000",
    cameraAngleId: "",
    cameraDistanceId: "",
    cameraPositionId: "",
    focusTargetId: "FOC_000",
    aspectRatio: "9:16",
    customAspectRatio: "",
    batchCount: 4,
    resultUrls: [] as string[],
    rawResult: null as unknown,
    compiledPromptSnapshot: "",
    finalPrompt: "",
    lastEditPrompt: "",
    selectedIndex: null as number | null,
    selectedCells: [] as string[],
    error: "",
    userMemo: "",
  };
}

export function lampClass(status: string) {
  return `lamp lamp-${status || "empty"}`;
}

export function statusText(status: string) {
  return (
    ({ empty: "비어 있음", ready: "준비 완료", running: "생성 중", done: "완료", error: "오류" } as Record<string, string>)[
      status
    ] || "비어 있음"
  );
}

export const ASPECT_OPTIONS = ["9:16", "16:9", "3:4", "4:3", "2:3", "3:2", "1:1", "Custom"];

export const WARN_MESSAGES: Record<string, string> = {
  WRN_002: "⚠ Exact pose mode may override camera/framing instructions. (실험값 기록 중)",
  WRN_004: "⚠ 프롬프트가 150단어를 초과합니다. 80~150단어를 권장합니다.",
  WRN_005: "⚠ 사진 포즈 레퍼런스는 인물 정체성 오염이 발생할 수 있습니다. 선화/스케치 권장.",
  WRN_006: "⚠ 카메라 모듈 미선택. 필요 시 Quick Preset 또는 Camera 항목을 선택하세요.",
};

type LibLike = { id: string; displayName: string; images: { filename: string }[] };

export function buildFigureMap(work: WorkState, selectedCharacters: LibLike[]): Figure[] {
  const figures: Figure[] = [];
  if (selectedCharacters[0])
    figures.push({
      figNo: figures.length + 1,
      type: "charA",
      label: `Character A: ${selectedCharacters[0].displayName}`,
      filename: selectedCharacters[0].images?.[work.charAPrimaryIndex || 0]?.filename || "",
    });
  if (selectedCharacters[1])
    figures.push({
      figNo: figures.length + 1,
      type: "charB",
      label: `Character B: ${selectedCharacters[1].displayName}`,
      filename: selectedCharacters[1].images?.[work.charBPrimaryIndex || 0]?.filename || "",
    });
  if (work.backgroundRef.url || work.backgroundRef.preview)
    figures.push({ figNo: figures.length + 1, type: "bg", label: "Background Reference" });
  if (work.poseRef.url || work.poseRef.preview)
    figures.push({ figNo: figures.length + 1, type: "pose", label: "Pose / Composition" });
  if (work.styleRef.enabled)
    figures.push({ figNo: figures.length + 1, type: "style", label: "Style Reference (Advanced)" });
  return figures;
}

function find(list: ConfigItem[] | undefined, id: string) {
  return (list || []).find((i) => i.id === id);
}

export function buildPromptV21(work: WorkState, figureMap: Figure[], config: PromptConfig) {
  const charA = figureMap.find((f) => f.type === "charA");
  const charB = figureMap.find((f) => f.type === "charB");
  const bgFig = figureMap.find((f) => f.type === "bg");
  const poseFig = figureMap.find((f) => f.type === "pose");
  const lines: string[] = [];
  const warnings: string[] = [];

  if (poseFig) {
    if (charA && charB) {
      lines.push(
        `Figure ${charA.figNo} is the reference for the Figure ${charA.figNo} character. Figure ${charB.figNo} is the reference for the Figure ${charB.figNo} character. Figure ${poseFig.figNo} is the pose and composition reference.${bgFig ? ` Figure ${bgFig.figNo} is the background reference.` : ""}`,
      );
    } else if (charA) {
      lines.push(
        `Figure ${charA.figNo} is the character reference. Figure ${poseFig.figNo} is the pose and composition reference.${bgFig ? ` Figure ${bgFig.figNo} is the background reference.` : ""}`,
      );
    }
  }

  if (charA && charB) {
    lines.push(
      `Keep Figure ${charA.figNo} as the only source for the Figure ${charA.figNo} character's face, hair color, hairstyle, body proportions, body silhouette, and skin tone.`,
    );
    lines.push(
      `Keep Figure ${charB.figNo} as the only source for the Figure ${charB.figNo} character's face, hair color, hairstyle, body proportions, body silhouette, and skin tone.`,
    );
  } else if (charA) {
    lines.push(
      `Keep Figure ${charA.figNo} as the only source for the character's face, hair color, hairstyle, body proportions, body silhouette, and skin tone.`,
    );
  }

  if (poseFig) {
    lines.push(
      `Use Figure ${poseFig.figNo} only as the pose, hand-gesture, contact points, and camera framing reference. Do not copy any facial features, hair, or body proportions from Figure ${poseFig.figNo}.`,
    );
    if (charA && charB) {
      lines.push(
        `Apply the Figure ${poseFig.figNo} pose to the Figure ${charA.figNo} character and the Figure ${charB.figNo} character according to their matching positions in the pose reference.`,
      );
    } else if (charA) {
      lines.push(`Replace the subject in Figure ${poseFig.figNo} with the Figure ${charA.figNo} character.`);
    }
    if (charA && charB) {
      lines.push(
        `Figure ${charA.figNo} and Figure ${charB.figNo} take priority over Figure ${poseFig.figNo} for all character appearance decisions.`,
      );
    } else if (charA) {
      lines.push(`Figure ${charA.figNo} takes priority over Figure ${poseFig.figNo} for all character appearance decisions.`);
    }
  }

  if (poseFig) {
    const poseItem = find(config.PoseStrength, work.poseStrengthId);
    if (poseItem) {
      const poseText = poseItem.prompt_text.replace(/Figure N/g, `Figure ${poseFig.figNo}`);
      if (work.poseStrengthId === "POS_004") warnings.push("WRN_002");
      lines.push(poseText + (poseText.endsWith(".") ? "" : "."));
    }
  }

  if (bgFig) {
    const bgItem = find(config.BgStrength, work.bgStrengthId);
    if (bgItem) {
      let bgText = bgItem.prompt_text.replace(/Figure N/g, `Figure ${bgFig.figNo}`);
      bgText = bgText.charAt(0).toUpperCase() + bgText.slice(1);
      lines.push(bgText + (bgText.endsWith(".") ? "" : "."));
    }
  }

  const bodyItem = find(config.BodySource, work.bodySourceId);
  if (bodyItem?.prompt_text) lines.push(bodyItem.prompt_text);

  const camAngle = find(config.CameraAngle, work.cameraAngleId);
  const camDist = find(config.CameraDistance, work.cameraDistanceId);
  const camPos = find(config.CameraPosition, work.cameraPositionId);
  const camPosText = resolveFigureRoleText(camPos?.prompt_text || "", charA, charB);
  const camParts = [camAngle?.prompt_text, camDist?.prompt_text, camPosText].filter(Boolean);
  if (camParts.length) lines.push(camParts.join(" "));

  const focusItem = find(config.FocusTarget, work.focusTargetId);
  if (focusItem?.prompt_text) lines.push(focusItem.prompt_text);

  const bgStyleItem = find(config.BgStyle, work.bgStyleId);
  if (bgStyleItem?.prompt_text) lines.push(bgStyleItem.prompt_text);

  const costumeItem = find(config.CostumeMode, work.costumeModeId);
  if (costumeItem?.prompt_text) lines.push(costumeItem.prompt_text);

  if (work.actionText?.trim()) lines.push(work.actionText.trim());

  if (work.emotionId && work.emotionId !== "EMO_000") {
    const emoItem = find(config.Emotion, work.emotionId);
    if (emoItem?.prompt_text) lines.push(emoItem.prompt_text);
  }

  if (work.directionMemo?.trim()) lines.push(work.directionMemo.trim());

  const styleItem = find(config.StyleFinish, work.styleFinishId);
  lines.push(styleItem?.prompt_text || "Korean commercial webtoon style, clean line art, natural cel shading.");

  if (work.isPhotopose) warnings.push("WRN_005");
  const wc = wordCount(lines.join(" "));
  if (wc > 150) warnings.push("WRN_004");

  let prompt = lines.filter(Boolean).join("\n");
  prompt = resolveFigureRoleText(prompt, charA, charB);
  return { prompt, warnings, wordCount: wordCount(prompt) };
}

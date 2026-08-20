import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { PROMPT_CONFIG, type ConfigItem } from "@/lib/prompt-config";
import {
  ASPECT_OPTIONS,
  WARN_MESSAGES,
  buildFigureMap,
  buildPromptV21,
  checkActionMissing,
  checkFigureN,
  downloadImage,
  extractUrls,
  fileToDataUrl,
  insertTextAtSelection,
  lampClass,
  makeWork,
  playChime,
  readImageFromClipboard,
  resolveFigureRoleText,
  sanitizePrompt,
  statusText,
  type WorkState,
} from "@/lib/prompt";
import {
  createCharacterEntry,
  createStyleEntry,
  deleteLibraryImage,
  deleteStyleEntry,
  loadCharacters as fetchCharacters,
  loadStyles as fetchStyles,
  uploadLibraryImage,
  type LibEntry,
} from "@/lib/library";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio 0103 Seedream Generator — 웹툰 이미지 생성 스튜디오" },
      {
        name: "description",
        content:
          "Figure 기반 단문 프롬프트 구조로 Seedream 이미지를 생성하는 클라우드 스튜디오. 캐릭터 라이브러리, 포즈·배경 레퍼런스, 3개 병렬 작업 탭 지원.",
      },
      { property: "og:title", content: "Studio 0103 Seedream Generator" },
      {
        property: "og:description",
        content: "Figure 기반 프롬프트 엔진으로 웹툰 컷 이미지를 생성하는 클라우드 스튜디오.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const cfg = PROMPT_CONFIG;
const sheet = (name: string): ConfigItem[] => cfg[name] || [];

function Index() {
  const [characters, setCharacters] = useState<LibEntry[]>([]);
  const [styles, setStyles] = useState<LibEntry[]>([]);
  const [configStatus, setConfigStatus] = useState("");
  const [works, setWorks] = useState<WorkState[]>([makeWork(1), makeWork(2), makeWork(3)]);
  const [activeWorkId, setActiveWorkId] = useState(1);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterId, setNewCharacterId] = useState("");
  const [characterUploadId, setCharacterUploadId] = useState("");
  const [characterUploadStatus, setCharacterUploadStatus] = useState("");
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleId, setNewStyleId] = useState("");
  const [styleUploadId, setStyleUploadId] = useState("");
  const [styleUploadStatus, setStyleUploadStatus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageDragging, setEditImageDragging] = useState(false);
  const [promptEdited, setPromptEdited] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeWork = works.find((w) => w.id === activeWorkId) || works[0]!;

  useEffect(() => {
    loadCharacters();
    loadStyles();
    setConfigStatus(`✓ Config loaded (내장 사전 V21.7)`);
  }, []);
  useEffect(() => {
    setSelectedCells([]);
    setEditImagePreview("");
    setPromptEdited(false);
  }, [activeWorkId]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function loadCharacters() {
    try {
      setCharacters(await fetchCharacters());
    } catch (err) {
      updateActive({ error: (err as Error).message, status: "error" });
    }
  }
  async function loadStyles() {
    try {
      setStyles(await fetchStyles());
    } catch (err) {
      console.error("loadStyles:", (err as Error).message);
    }
  }
  async function reloadConfig() {
    setConfigStatus("재로딩 중...");
    await Promise.all([loadCharacters(), loadStyles()]);
    setConfigStatus(`✓ Reloaded — ${new Date().toLocaleTimeString()}`);
  }

  function updateWork(id: number, patch: Partial<WorkState>) {
    setWorks((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function updateActive(patch: Partial<WorkState>) {
    updateWork(activeWorkId, patch);
  }
  function updateActiveField<K extends keyof WorkState>(key: K, value: WorkState[K]) {
    const patch = { [key]: value } as Partial<WorkState>;
    const next = { ...activeWork, ...patch } as WorkState;
    patch.status = isReady(next) ? "ready" : "empty";
    updateActive(patch);
  }

  function isReady(work: WorkState) {
    const chars = work.selectedCharacterIds.filter(Boolean);
    return (
      chars.length > 0 ||
      !!work.poseRef.url ||
      !!work.poseRef.preview ||
      !!work.backgroundRef.url ||
      !!work.backgroundRef.preview
    );
  }

  function resetWork(id: number) {
    const w = works.find((x) => x.id === id);
    const fresh = makeWork(id);
    fresh.name = w ? w.name : `Work ${id}`;
    setWorks((prev) => prev.map((x) => (x.id === id ? fresh : x)));
  }
  function copyWorkTo(fromId: number, toId: number) {
    const from = works.find((w) => w.id === fromId);
    if (!from) return;
    setWorks((prev) =>
      prev.map((w) =>
        w.id === toId
          ? {
              ...from,
              id: toId,
              name: `Work ${toId}`,
              status: "empty",
              resultUrls: [],
              rawResult: null,
              compiledPromptSnapshot: "",
              finalPrompt: "",
              lastEditPrompt: "",
              selectedIndex: null,
              selectedCells: [],
              error: "",
              elapsed: 0,
              completedText: "",
              batchProgress: "",
            }
          : w,
      ),
    );
  }
  function clearResults(id: number) {
    updateWork(id, {
      resultUrls: [],
      rawResult: null,
      compiledPromptSnapshot: "",
      finalPrompt: "",
      lastEditPrompt: "",
      selectedIndex: null,
      selectedCells: [],
      status: "empty",
      error: "",
      completedText: "",
      batchProgress: "",
    });
  }

  const selectedCharacters = useMemo(
    () =>
      activeWork.selectedCharacterIds
        .filter(Boolean)
        .map((id) => characters.find((c) => c.id === id))
        .filter(Boolean) as LibEntry[],
    [activeWork.selectedCharacterIds, characters],
  );

  const figureMap = useMemo(() => buildFigureMap(activeWork, selectedCharacters), [activeWork, selectedCharacters]);
  const charA = useMemo(() => figureMap.find((f) => f.type === "charA"), [figureMap]);
  const charB = useMemo(() => figureMap.find((f) => f.type === "charB"), [figureMap]);

  const { prompt: autoPrompt, warnings, wordCount: wc } = useMemo(
    () => buildPromptV21(activeWork, figureMap, cfg),
    [activeWork, figureMap],
  );

  useEffect(() => {
    if (!promptEdited) updateActive({ compiledPromptSnapshot: autoPrompt, finalPrompt: autoPrompt });
    else updateActive({ compiledPromptSnapshot: autoPrompt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrompt]);

  const selectedStyle = useMemo(
    () => styles.find((s) => s.id === activeWork.styleRef.selectedStyleId) || null,
    [styles, activeWork.styleRef.selectedStyleId],
  );

  const imageInputs = useMemo(() => {
    const arr: string[] = [];
    if (selectedCharacters[0]) {
      const img =
        selectedCharacters[0].images?.[activeWork.charAPrimaryIndex || 0] || selectedCharacters[0].images?.[0];
      if (img) arr.push(img.url);
    }
    if (selectedCharacters[1]) {
      const img =
        selectedCharacters[1].images?.[activeWork.charBPrimaryIndex || 0] || selectedCharacters[1].images?.[0];
      if (img) arr.push(img.url);
    }
    if (activeWork.backgroundRef.url || activeWork.backgroundRef.preview)
      arr.push(activeWork.backgroundRef.url || activeWork.backgroundRef.preview);
    if (activeWork.poseRef.url || activeWork.poseRef.preview)
      arr.push(activeWork.poseRef.url || activeWork.poseRef.preview);
    if (activeWork.styleRef.enabled && selectedStyle) {
      (selectedStyle.images || []).slice(0, 3).forEach((img) => arr.push(img.url));
    }
    return arr.filter(Boolean);
  }, [
    selectedCharacters,
    activeWork.charAPrimaryIndex,
    activeWork.charBPrimaryIndex,
    activeWork.backgroundRef,
    activeWork.poseRef,
    activeWork.styleRef,
    selectedStyle,
  ]);

  // ─── Character CRUD ─────────────────────────────────────────
  async function createCharacter() {
    if (!newCharacterName.trim() || !newCharacterId.trim()) {
      alert("이름과 폴더 ID를 모두 입력하세요.");
      return;
    }
    try {
      await createCharacterEntry(newCharacterId.trim(), newCharacterName.trim());
      setNewCharacterName("");
      setNewCharacterId("");
      await loadCharacters();
    } catch (err) {
      alert("캐릭터 추가 실패: " + (err as Error).message);
    }
  }
  async function uploadCharacterFile(file?: File | null) {
    if (!file || !characterUploadId)
      return updateActive({ error: "업로드 대상 캐릭터를 선택하세요.", status: "error" });
    try {
      setCharacterUploadStatus("Uploading...");
      await uploadLibraryImage("character", characterUploadId, file);
      setCharacterUploadStatus("완료");
      await loadCharacters();
    } catch (err) {
      setCharacterUploadStatus("");
      updateActive({ error: (err as Error).message, status: "error" });
    }
  }
  async function deleteCharacterImage(storagePath: string, filename: string) {
    if (!window.confirm(`레퍼런스 이미지를 삭제할까요?\n${filename}`)) return;
    try {
      await deleteLibraryImage("character", storagePath);
      await loadCharacters();
    } catch (err) {
      updateActive({ error: (err as Error).message, status: "error" });
    }
  }

  // ─── Reference Handlers ─────────────────────────────────────
  async function handleRefFile(kind: "poseRef" | "backgroundRef", file?: File | null) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateActiveField(kind, { url: "", preview: dataUrl });
  }
  async function pasteRef(kind: "poseRef" | "backgroundRef") {
    try {
      const dataUrl = await readImageFromClipboard();
      updateActiveField(kind, { url: "", preview: dataUrl });
    } catch (err) {
      updateActive({ error: (err as Error).message, status: "error" });
    }
  }
  async function handleEditImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setEditImageDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await fileToDataUrl(file);
    setEditImagePreview(dataUrl);
    updateActive({ selectedIndex: null, error: "" });
  }
  async function handleEditImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await fileToDataUrl(file);
    setEditImagePreview(dataUrl);
    updateActive({ selectedIndex: null, error: "" });
    e.target.value = "";
  }

  async function callGenerate(body: Record<string, unknown>) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; raw?: unknown; error?: string; detail?: unknown }
      | null;
    if (!res.ok || !data?.ok) {
      const err = new Error(data?.error || `HTTP ${res.status}`) as Error & { status?: number; detail?: unknown };
      err.status = res.status;
      err.detail = data?.detail;
      throw err;
    }
    return data;
  }

  // ─── Generate ───────────────────────────────────────────────
  async function generate() {
    const count = Number(activeWork.batchCount) || 1;
    const targetId = activeWorkId;

    const rawFinal = activeWork.finalPrompt || autoPrompt;
    let finalPromptToSend = sanitizePrompt(rawFinal);
    finalPromptToSend = resolveFigureRoleText(finalPromptToSend, charA, charB);
    if (finalPromptToSend !== rawFinal) updateWork(targetId, { finalPrompt: finalPromptToSend });

    if (checkFigureN(finalPromptToSend)) {
      updateActive({
        error: "⚠ 프롬프트에 'Figure N' 미치환 문구가 있습니다. 프롬프트를 확인하세요.\n\n차단 이유: FIGURE_N_NOT_REPLACED",
        status: "error",
      });
      return;
    }
    if (checkActionMissing(finalPromptToSend, activeWork.actionText)) {
      updateActive({
        error:
          "⚠ Action 설명이 프롬프트에 없습니다.\n\nFinal Prompt를 확인하고 Action 내용을 포함시킨 뒤 재생성하세요.\n\n차단 이유: ACTION_TEXT_MISSING_IN_FINAL_PROMPT",
        status: "error",
      });
      return;
    }

    const capturedImages = [...imageInputs];
    const capturedFigureMap = Object.fromEntries(figureMap.map((f) => [`Figure ${f.figNo}`, f.label]));
    const workLabel = `W${targetId}`;
    const generationId = Date.now().toString();

    updateWork(targetId, {
      status: "running",
      error: "",
      resultUrls: [],
      rawResult: null,
      selectedIndex: null,
      lastEditPrompt: "",
      elapsed: 0,
      completedText: "",
      batchProgress: `0/${count}`,
    });
    const start = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      updateWork(targetId, { elapsed: Math.floor((Date.now() - start) / 1000) });
    }, 1000);

    const allUrls: string[] = [];
    const batchErrors: string[] = [];
    let lastRaw: unknown = null;

    for (let i = 0; i < count; i++) {
      updateWork(targetId, { batchProgress: `${i}/${count} 생성 중` });
      const variantPrompt =
        i === 0
          ? finalPromptToSend
          : `${finalPromptToSend}\n\nGenerate variation ${i + 1}. Keep character identity and composition. Vary minor expression, lighting, and details.`;
      try {
        const data = await callGenerate({
          prompt: variantPrompt,
          images: capturedImages,
          size: "2K",
          aspectRatio: activeWork.aspectRatio === "Custom" ? activeWork.customAspectRatio : activeWork.aspectRatio,
          watermark: false,
          workId: workLabel,
          batchIndex: i,
          generationId,
          compiledPrompt: autoPrompt,
          finalPrompt: finalPromptToSend,
          logData: {
            figureMap: capturedFigureMap,
            referenceFiles: Object.entries(capturedFigureMap).map(([fig, label]) => ({ figure: fig, role: label })),
            aspectRatio: activeWork.aspectRatio,
            selectedOptions: {
              poseStrengthId: activeWork.poseStrengthId,
              bgStrengthId: activeWork.bgStrengthId,
              viewCompositionId: activeWork.viewCompositionId,
              emotionId: activeWork.emotionId,
              styleFinishId: activeWork.styleFinishId,
              bgStyleId: activeWork.bgStyleId,
              costumeModeId: activeWork.costumeModeId,
              bodySourceId: activeWork.bodySourceId,
              cameraAngleId: activeWork.cameraAngleId,
              cameraDistanceId: activeWork.cameraDistanceId,
              cameraPositionId: activeWork.cameraPositionId,
              focusTargetId: activeWork.focusTargetId,
              aspectRatio: activeWork.aspectRatio,
              customAspectRatio: activeWork.customAspectRatio,
            },
            actionText: activeWork.actionText,
            directionMemo: activeWork.directionMemo,
            conflictWarnings: warnings,
            isPhotopose: activeWork.isPhotopose,
            userMemo: activeWork.userMemo,
          },
        });
        const urls = extractUrls(data.raw);
        allUrls.push(...urls);
        lastRaw = data.raw;
        updateWork(targetId, { resultUrls: [...allUrls], batchProgress: `${i + 1}/${count} 완료` });
      } catch (err) {
        const e = err as Error & { status?: number; detail?: unknown };
        const status = e.status ? `HTTP ${e.status}` : "REQUEST_ERROR";
        const detailRaw = e.detail ? JSON.stringify(e.detail) : "";
        const detail = detailRaw.slice(0, 800);
        const hint = explainSeedreamError(detailRaw);
        const msg = `Batch ${i + 1} failed: ${status} / ${e.message}${hint ? `\n→ ${hint}` : ""}${detail ? ` / detail: ${detail}` : ""}`;
        console.error(msg);
        batchErrors.push(msg);
      }
    }


    if (timerRef.current) clearInterval(timerRef.current);
    const secs = Math.floor((Date.now() - start) / 1000);
    if (allUrls.length > 0) playChime();
    updateWork(targetId, {
      rawResult: lastRaw,
      status: allUrls.length > 0 ? "done" : "error",
      completedText:
        allUrls.length > 0
          ? `Completed in ${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
          : "",
      batchProgress: `${allUrls.length}/${count}`,
      error:
        allUrls.length === 0
          ? `모든 생성이 실패했습니다. API 설정과 프롬프트를 확인하세요.\n\n${batchErrors.join("\n") || "서버 응답 오류 정보가 없습니다."}`
          : "",
    });
  }

  async function startNewImage() {
    if (editImagePreview) {
      return updateActive({
        error: "드롭존 이미지가 있습니다. 새 이미지를 만들려면 드롭존 이미지를 먼저 치워주세요.",
        status: "error",
      });
    }
    if (activeWork.selectedIndex !== null && activeWork.resultUrls[activeWork.selectedIndex]) {
      return updateActive({
        error: "선택된 결과 이미지가 있습니다. 새 이미지를 만들려면 선택을 해제하세요.",
        status: "error",
      });
    }
    return generate();
  }

  async function editSelected() {
    const isExternalImage = !!editImagePreview;
    const targetImage = isExternalImage
      ? editImagePreview
      : activeWork.selectedIndex !== null
        ? activeWork.resultUrls[activeWork.selectedIndex]
        : null;
    if (!targetImage) return updateActive({ error: "수정할 이미지를 드롭하거나 결과 이미지를 선택하세요.", status: "error" });
    const editInstruction = sanitizePrompt(activeWork.finalPrompt || autoPrompt);
    if (!editInstruction.trim()) return updateActive({ error: "Final Prompt에 수정 요청을 입력하세요.", status: "error" });
    const cells = selectedCells.length ? selectedCells.join(", ") : "the visually relevant area";
    const editPrompt = isExternalImage
      ? `STRICT IMAGE EDIT TASK.\nUse Image 1 as the source image.\nUse the Korean user instruction as the main edit command.\nChange the requested visual details clearly.\nPreserve only the parts that are not related to the requested edit.\nDo not simply copy Image 1 without applying the instruction.\nDo not create an unrelated new scene.\n\nUser instruction:\n${editInstruction}`
      : `STRICT IMAGE EDIT TASK.\nUse Image 1 as the current generated image.\nApply changes only to: ${cells}.\nPreserve all unrelated areas, identity, composition, camera angle, lighting, and background.\nDo not create a new scene. Do not ignore the user instruction.\n\nUser instruction:\n${editInstruction}`;
    updateActive({ status: "running", error: "", lastEditPrompt: editPrompt });
    try {
      const data = await callGenerate({
        prompt: editPrompt,
        images: [targetImage],
        size: "2K",
        watermark: false,
        workId: `W${activeWorkId}_edit`,
        batchIndex: 0,
        compiledPrompt: editPrompt,
        finalPrompt: editPrompt,
        logData: {
          figureMap: isExternalImage ? { "Image 1": "Dropped Edit Reference" } : {},
          referenceFiles: isExternalImage ? [{ figure: "Image 1", role: "Dropped Edit Reference" }] : [],
          actionText: editInstruction,
          directionMemo: "",
          conflictWarnings: [],
        },
      });
      const newUrls = extractUrls(data.raw);
      setSelectedCells([]);
      setEditImagePreview("");
      updateWork(activeWorkId, {
        rawResult: data.raw,
        resultUrls: newUrls.length > 0 ? newUrls : activeWork.resultUrls,
        selectedIndex: newUrls.length > 0 ? 0 : activeWork.selectedIndex,
        lastEditPrompt: editPrompt,
        status: "done",
        error: "",
      });
    } catch (err) {
      updateActive({ error: (err as Error).message, status: "error" });
    }
  }

  const hasDroppedEditTarget = !!editImagePreview;
  const hasSelectedEditTarget = activeWork.selectedIndex !== null && !!activeWork.resultUrls[activeWork.selectedIndex];
  const executionTargetLabel = hasDroppedEditTarget
    ? "현재 대상: 드롭존 이미지 수정"
    : hasSelectedEditTarget
      ? "현재 대상: 선택된 결과 이미지 수정"
      : "현재 대상: 새 이미지 생성";

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="sg-root">
      <header className="header">
        <div>
          <h1>
            Studio 0103 Seedream Generator{" "}
            <span className="ver-tag">V21.7 STABLE - Prompt/Action Unified - Camera UI Fix</span>
          </h1>
          <p>Seedream 프롬프트 실험 엔진 · Figure 기반 단문 구조 · BytePlus 공식 피드백 반영</p>
        </div>
        <div className="header-right">
          <div className="config-bar">
            <span className="config-status">{configStatus}</span>
            <button className="reload-btn" onClick={reloadConfig}>
              ⟳ Reload Config
            </button>
          </div>
          <div className="badge">V21.7 STABLE</div>
        </div>
      </header>

      <div className="work-tabs">
        {works.map((w) => (
          <div key={w.id} className={"work-tab-wrap" + (activeWorkId === w.id ? " active" : "")}>
            <button className={activeWorkId === w.id ? "work-tab active" : "work-tab"} onClick={() => setActiveWorkId(w.id)}>
              <span className={lampClass(w.status)}></span>
              <b>{w.name}</b>
              <small>
                {statusText(w.status)} {w.status === "running" ? w.batchProgress || w.elapsed + "s" : w.completedText}
              </small>
            </button>
            <div className="work-actions">
              {works
                .filter((x) => x.id !== w.id)
                .map((other) => (
                  <button
                    key={other.id}
                    type="button"
                    className="wbtn"
                    title={`Work ${other.id}에 복제`}
                    onClick={() => copyWorkTo(w.id, other.id)}
                  >
                    →W{other.id}
                  </button>
                ))}
              <button type="button" className="wbtn wbtn-clear" onClick={() => clearResults(w.id)}>
                비우기
              </button>
              <button
                type="button"
                className="wbtn wbtn-reset"
                onClick={() => {
                  if (window.confirm(`Work ${w.id}를 초기화할까요?`)) resetWork(w.id);
                }}
              >
                초기화
              </button>
            </div>
          </div>
        ))}
      </div>

      <main className="grid">
        {/* Panel 1 */}
        <section className="panel">
          <h2>1. Character Library</h2>
          <div className="notice">캐릭터 라이브러리는 공용. V21은 캐릭터당 대표 시트 1장만 전송합니다.</div>

          <div className="field character-create">
            <label>New Character</label>
            <div className="inline-grid">
              <input value={newCharacterName} onChange={(e) => setNewCharacterName(e.target.value)} placeholder="표시 이름: 조민아" />
              <input value={newCharacterId} onChange={(e) => setNewCharacterId(e.target.value)} placeholder="폴더 ID: jo_mina" />
              <button type="button" onClick={createCharacter}>
                + 추가
              </button>
            </div>
          </div>

          <div className="field">
            <label>Upload Character Reference</label>
            <div className="inline-grid two">
              <select value={characterUploadId} onChange={(e) => setCharacterUploadId(e.target.value)}>
                <option value="">업로드 대상 캐릭터 선택</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.id})
                  </option>
                ))}
              </select>
              <input type="file" accept="image/*" onChange={(e) => uploadCharacterFile(e.target.files?.[0])} />
            </div>
            {characterUploadStatus && <p className="mini">{characterUploadStatus}</p>}
          </div>

          <div className="character-list">
            {characters.map((character) => (
              <div className="library-card" key={character.id}>
                <div className="char-title">
                  {character.displayName} <span>/{character.id}</span>
                </div>
                <div className="thumb-row">
                  {(character.images || []).map((img) => (
                    <div className="thumb-box" key={img.storagePath}>
                      <img src={img.url} title={img.filename} alt={img.filename} />
                      <button type="button" onClick={() => deleteCharacterImage(img.storagePath, img.filename)}>
                        삭제
                      </button>
                    </div>
                  ))}
                  {(!character.images || character.images.length === 0) && (
                    <div className="char-empty small-empty">이미지 없음</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="advanced-toggle-bar">
            <button className="advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "▲ Advanced Reference 숨기기" : "▼ Advanced Reference (Style Library)"}
            </button>
          </div>
          {showAdvanced && (
            <div className="advanced-section">
              <h3>Style Library (Advanced — 실험용)</h3>
              <div className="notice warn-notice">스타일은 기본적으로 캐릭터 시트에 통합. 별도 실험 시에만 사용.</div>
              <div className="field character-create">
                <label>New Style Preset</label>
                <div className="inline-grid">
                  <input value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)} placeholder="표시명" />
                  <input value={newStyleId} onChange={(e) => setNewStyleId(e.target.value)} placeholder="폴더 ID" />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newStyleName.trim() || !newStyleId.trim()) return;
                      await createStyleEntry(newStyleId.trim(), newStyleName.trim());
                      setNewStyleName("");
                      setNewStyleId("");
                      await loadStyles();
                    }}
                  >
                    + 추가
                  </button>
                </div>
              </div>
              <div className="field">
                <div className="inline-grid two">
                  <select value={styleUploadId} onChange={(e) => setStyleUploadId(e.target.value)}>
                    <option value="">업로드 대상 스타일</option>
                    {styles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.images?.length || 0}/3)
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !styleUploadId) return;
                      setStyleUploadStatus("Uploading...");
                      await uploadLibraryImage("style", styleUploadId, file);
                      setStyleUploadStatus("완료");
                      await loadStyles();
                    }}
                  />
                </div>
                {styleUploadStatus && <p className="mini">{styleUploadStatus}</p>}
              </div>
              <div className="character-list">
                {styles.map((s) => (
                  <div className="library-card" key={s.id}>
                    <div className="char-title">
                      {s.displayName} <span>/{s.id}</span>
                      <button
                        type="button"
                        className="del-style-btn"
                        onClick={async () => {
                          if (window.confirm(`스타일 "${s.id}" 삭제?`)) {
                            await deleteStyleEntry(s.id);
                            await loadStyles();
                          }
                        }}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="thumb-row">
                      {(s.images || []).map((img) => (
                        <div className="thumb-box" key={img.storagePath}>
                          <img src={img.url} title={img.filename} alt={img.filename} />
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteLibraryImage("style", img.storagePath);
                              await loadStyles();
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Panel 2 */}
        <section className="panel">
          <h2>2. {activeWork.name} — References</h2>

          <div className="field character-group">
            <label>Character A</label>
            <select
              value={activeWork.selectedCharacterIds[0] || ""}
              onChange={(e) =>
                updateActiveField("selectedCharacterIds", [e.target.value, activeWork.selectedCharacterIds[1] || ""])
              }
            >
              <option value="">선택 안 함</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.images?.length || 0} sheets)
                </option>
              ))}
            </select>
            {selectedCharacters[0] && (selectedCharacters[0].images || []).length > 0 && (
              <div className="primary-select">
                <span className="primary-label">대표 시트 선택 (V21: 1장만 전송)</span>
                <div className="thumb-row">
                  {(selectedCharacters[0].images || []).map((img, i) => (
                    <div
                      key={img.storagePath}
                      className={"thumb-box primary-thumb" + (i === (activeWork.charAPrimaryIndex || 0) ? " primary-selected" : "")}
                      onClick={() => updateActiveField("charAPrimaryIndex", i)}
                    >
                      <img src={img.url} title={img.filename} alt={img.filename} />
                      {i === (activeWork.charAPrimaryIndex || 0) && <div className="primary-badge">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label style={{ marginTop: "12px" }}>
              Character B <span className="label-hint">(2인 컷 시)</span>
            </label>
            <select
              value={activeWork.selectedCharacterIds[1] || ""}
              onChange={(e) =>
                updateActiveField("selectedCharacterIds", [activeWork.selectedCharacterIds[0] || "", e.target.value])
              }
            >
              <option value="">없음 (1인 컷)</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.images?.length || 0} sheets)
                </option>
              ))}
            </select>
            {selectedCharacters[1] && (selectedCharacters[1].images || []).length > 0 && (
              <div className="primary-select">
                <span className="primary-label">캐릭터 B 대표 시트</span>
                <div className="thumb-row">
                  {(selectedCharacters[1].images || []).map((img, i) => (
                    <div
                      key={img.storagePath}
                      className={"thumb-box primary-thumb" + (i === (activeWork.charBPrimaryIndex || 0) ? " primary-selected" : "")}
                      onClick={() => updateActiveField("charBPrimaryIndex", i)}
                    >
                      <img src={img.url} title={img.filename} alt={img.filename} />
                      {i === (activeWork.charBPrimaryIndex || 0) && <div className="primary-badge">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCharacters[1] && (
              <div className="focus-selector">
                <label className="label-hint">ViewComposition 포커스 캐릭터</label>
                <div className="btn-group">
                  <button
                    type="button"
                    className={"strength-btn" + (activeWork.focusChar === "A" ? " strength-btn-active" : "")}
                    onClick={() => updateActiveField("focusChar", "A")}
                  >
                    A 포커스
                  </button>
                  <button
                    type="button"
                    className={"strength-btn" + (activeWork.focusChar === "B" ? " strength-btn-active" : "")}
                    onClick={() => updateActiveField("focusChar", "B")}
                  >
                    B 포커스
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="field important">
            <label>Pose / Composition Reference</label>
            <div className="pose-warning">포즈·구도·카메라만 사용. 인물 정체성 복사 금지.</div>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={activeWork.isPhotopose}
                onChange={(e) => updateActiveField("isPhotopose", e.target.checked)}
              />
              &nbsp;사진 포즈 레퍼런스 사용 중 (경고 표시)
            </label>
            <input
              value={activeWork.poseRef.url}
              onChange={(e) => updateActiveField("poseRef", { ...activeWork.poseRef, url: e.target.value })}
              placeholder="https://..."
            />
            <input type="file" accept="image/*" onChange={(e) => handleRefFile("poseRef", e.target.files?.[0])} />
            <div className="button-row">
              <button type="button" onClick={() => pasteRef("poseRef")}>
                클립보드 붙여넣기
              </button>
              <button type="button" onClick={() => updateActiveField("poseRef", { url: "", preview: "" })}>
                삭제
              </button>
            </div>
            {activeWork.poseRef.preview && <img className="preview" src={activeWork.poseRef.preview} alt="pose reference" />}
          </div>

          <div className="field background-field">
            <label>Background Reference</label>
            <div className="pose-warning">배경·공간·조명·기물만 사용. 배경 속 인물 복사 금지.</div>
            <input
              value={activeWork.backgroundRef.url}
              onChange={(e) => updateActiveField("backgroundRef", { ...activeWork.backgroundRef, url: e.target.value })}
              placeholder="https://..."
            />
            <input type="file" accept="image/*" onChange={(e) => handleRefFile("backgroundRef", e.target.files?.[0])} />
            <div className="button-row">
              <button type="button" onClick={() => pasteRef("backgroundRef")}>
                클립보드 붙여넣기
              </button>
              <button type="button" onClick={() => updateActiveField("backgroundRef", { url: "", preview: "" })}>
                삭제
              </button>
            </div>
            {activeWork.backgroundRef.preview && (
              <img className="preview" src={activeWork.backgroundRef.preview} alt="background reference" />
            )}
          </div>

          {showAdvanced && (
            <div className="field">
              <label>
                Style Reference <span className="label-hint">(Advanced — 기본 OFF)</span>
              </label>
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={activeWork.styleRef.enabled}
                  onChange={(e) => updateActiveField("styleRef", { ...activeWork.styleRef, enabled: e.target.checked })}
                />
                &nbsp;Style Reference 사용
              </label>
              {activeWork.styleRef.enabled && (
                <select
                  value={activeWork.styleRef.selectedStyleId}
                  onChange={(e) => updateActiveField("styleRef", { ...activeWork.styleRef, selectedStyleId: e.target.value })}
                >
                  <option value="">스타일 선택</option>
                  {styles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </section>

        {/* Panel 3 */}
        <section className="panel">
          <h2>3. Prompt Controls</h2>

          <div className="field">
            <label>Pose Strength</label>
            <div className="btn-group">
              {sheet("PoseStrength").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"strength-btn" + (activeWork.poseStrengthId === item.id ? " strength-btn-active" : "")}
                  onClick={() => updateActiveField("poseStrengthId", item.id)}
                  title={item.prompt_text}
                >
                  {item.label_ko}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Background Strength</label>
            <div className="btn-group">
              {sheet("BgStrength").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"strength-btn" + (activeWork.bgStrengthId === item.id ? " strength-btn-active" : "")}
                  onClick={() => updateActiveField("bgStrengthId", item.id)}
                  title={item.prompt_text}
                >
                  {item.label_ko}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Emotion</label>
            <select value={activeWork.emotionId} onChange={(e) => updateActiveField("emotionId", e.target.value)}>
              {sheet("Emotion").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label_ko}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Action / Pose Description <span className="label-hint">(자유 입력)</span>
            </label>
            <textarea
              value={activeWork.actionText}
              onChange={(e) => updateActiveField("actionText", e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                const cleaned = sanitizePrompt(pasted);
                if (cleaned && cleaned !== pasted) {
                  e.preventDefault();
                  const el = e.currentTarget;
                  updateActiveField(
                    "actionText",
                    insertTextAtSelection(activeWork.actionText, cleaned, el.selectionStart, el.selectionEnd),
                  );
                }
              }}
              placeholder={"예) 미나가 손을 내밀어 형우를 일으키려 한다.\n(한글 입력 가능. 영어보다 해석이 덜 정밀할 수 있으니 실험 비교 권장)"}
              rows={10}
            />
          </div>

          <div className="field">
            <label>
              Direction Memo <span className="label-hint">(연출 메모, 선택)</span>
            </label>
            <input
              value={activeWork.directionMemo}
              onChange={(e) => updateActiveField("directionMemo", e.target.value)}
              placeholder="예) Backlit from behind Mina."
            />
          </div>

          <div className="field">
            <label>Style Finish</label>
            <select value={activeWork.styleFinishId} onChange={(e) => updateActiveField("styleFinishId", e.target.value)}>
              {sheet("StyleFinish").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label_ko}
                </option>
              ))}
            </select>
          </div>

          <div className="section-divider">📷 Camera (V21.2.6 / Figure-only Prompt)</div>

          <div className="field">
            <label>Quick Preset</label>
            <div className="btn-group" style={{ flexWrap: "wrap" }}>
              {[
                { label: "아이레벨 전신", a: "CAM_A_EYE", d: "CAM_D_FULL", p: "CAM_P_A_FRONT", f: "FOC_FULL" },
                { label: "클로즈업", a: "CAM_A_EYE", d: "CAM_D_CLOSE", p: "CAM_P_A_FRONT", f: "FOC_FACE" },
                { label: "로우앵글", a: "CAM_A_LOW_STRONG", d: "CAM_D_MEDIUM", p: "CAM_P_A_FRONT", f: "FOC_UPPER" },
                { label: "하이앵글", a: "CAM_A_HIGH_STEEP", d: "CAM_D_FULL", p: "CAM_P_A_FRONT", f: "FOC_FULL" },
                { label: "오버숄더A→B", a: "CAM_A_EYE", d: "CAM_D_MEDIUM_CLOSE", p: "CAM_P_OVER_A", f: "FOC_FACE" },
                { label: "오버숄더B→A", a: "CAM_A_EYE", d: "CAM_D_MEDIUM_CLOSE", p: "CAM_P_OVER_B", f: "FOC_FACE" },
                { label: "초근접", a: "CAM_A_EYE", d: "CAM_D_EXTREME_CLOSE", p: "CAM_P_A_FRONT", f: "FOC_FACE" },
                { label: "버드아이", a: "CAM_A_BIRD", d: "CAM_D_MEDIUM", p: "CAM_P_A_FRONT", f: "FOC_FULL" },
              ].map(({ label, a, d, p, f }) => (
                <button
                  key={label}
                  type="button"
                  className="strength-btn"
                  style={{ fontSize: "10px", padding: "4px 7px" }}
                  onClick={() => {
                    updateActiveField("cameraAngleId", a);
                    updateWork(activeWorkId, {
                      cameraDistanceId: d,
                      cameraPositionId: p,
                      focusTargetId: f,
                      status: isReady({ ...activeWork, cameraAngleId: a }) ? "ready" : "empty",
                    });
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="strength-btn"
                style={{ fontSize: "10px", padding: "4px 7px", color: "#ef4444" }}
                onClick={() =>
                  updateWork(activeWorkId, {
                    cameraAngleId: "",
                    cameraDistanceId: "",
                    cameraPositionId: "",
                    focusTargetId: "FOC_000",
                  })
                }
              >
                초기화
              </button>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Angle</label>
              <select value={activeWork.cameraAngleId} onChange={(e) => updateActiveField("cameraAngleId", e.target.value)}>
                <option value="">— 선택 안 함 —</option>
                {sheet("CameraAngle").map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label_ko}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Distance</label>
              <select value={activeWork.cameraDistanceId} onChange={(e) => updateActiveField("cameraDistanceId", e.target.value)}>
                <option value="">— 선택 안 함 —</option>
                {sheet("CameraDistance").map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label_ko}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Position</label>
              <select value={activeWork.cameraPositionId} onChange={(e) => updateActiveField("cameraPositionId", e.target.value)}>
                <option value="">— 선택 안 함 —</option>
                <optgroup label="A 기준">
                  {sheet("CameraPosition")
                    .filter((i) => i.id.startsWith("CAM_P_A"))
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label_ko}
                      </option>
                    ))}
                </optgroup>
                {selectedCharacters.length >= 2 && (
                  <optgroup label="B 기준">
                    {sheet("CameraPosition")
                      .filter((i) => i.id.startsWith("CAM_P_B"))
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label_ko}
                        </option>
                      ))}
                  </optgroup>
                )}
                {selectedCharacters.length >= 2 && (
                  <optgroup label="2인 특수">
                    {sheet("CameraPosition")
                      .filter((i) => ["CAM_P_OVER_A", "CAM_P_OVER_B", "CAM_P_BETWEEN"].includes(i.id))
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label_ko}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="field">
              <label>Focus</label>
              <select value={activeWork.focusTargetId} onChange={(e) => updateActiveField("focusTargetId", e.target.value)}>
                {sheet("FocusTarget").map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label_ko}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(activeWork.cameraAngleId || activeWork.cameraDistanceId || activeWork.cameraPositionId) && (
            <p className="mini hint-text" style={{ marginTop: "4px" }}>
              {[
                sheet("CameraAngle").find((i) => i.id === activeWork.cameraAngleId)?.label_ko,
                sheet("CameraDistance").find((i) => i.id === activeWork.cameraDistanceId)?.label_ko,
                sheet("CameraPosition").find((i) => i.id === activeWork.cameraPositionId)?.label_ko,
                sheet("FocusTarget").find((i) => i.id === activeWork.focusTargetId)?.label_ko,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}

          <div className="section-divider">🎭 Background &amp; Costume (V21.1)</div>

          <div className="field">
            <label>Background Style</label>
            <select value={activeWork.bgStyleId} onChange={(e) => updateActiveField("bgStyleId", e.target.value)}>
              {sheet("BgStyle").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label_ko}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Costume Mode</label>
            <div className="btn-group">
              {sheet("CostumeMode").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"strength-btn" + (activeWork.costumeModeId === item.id ? " strength-btn-active" : "")}
                  onClick={() => updateActiveField("costumeModeId", item.id)}
                  title={item.prompt_text}
                >
                  {item.label_ko}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>
              Body Source <span className="label-hint">(체형 출처 우선순위)</span>
            </label>
            <div className="btn-group">
              {sheet("BodySource").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"strength-btn" + (activeWork.bodySourceId === item.id ? " strength-btn-active" : "")}
                  onClick={() => updateActiveField("bodySourceId", item.id)}
                  title={item.prompt_text}
                >
                  {item.label_ko}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>화면 비율</label>
              <select value={activeWork.aspectRatio} onChange={(e) => updateActiveField("aspectRatio", e.target.value)}>
                {ASPECT_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {activeWork.aspectRatio === "Custom" && (
                <input
                  value={activeWork.customAspectRatio}
                  onChange={(e) => updateActiveField("customAspectRatio", e.target.value)}
                  placeholder="예: 4:5"
                />
              )}
            </div>
            <div className="field">
              <label>Batch Count</label>
              <select value={activeWork.batchCount} onChange={(e) => updateActiveField("batchCount", Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Panel 4 */}
        <section className="panel result-panel">
          <h2>4. Prompt Preview &amp; Result</h2>

          <div className="figure-map">
            <div className="figure-map-title">Figure Map</div>
            {figureMap.length === 0 ? (
              <p className="mini">레퍼런스를 추가하면 Figure Map이 표시됩니다.</p>
            ) : (
              figureMap.map((f) => (
                <div key={f.figNo} className={`figure-row figure-${f.type}`}>
                  <span className="figure-no">Figure {f.figNo}</span>
                  <span className="figure-label">{f.label}</span>
                  {f.filename && <span className="figure-file">{f.filename}</span>}
                </div>
              ))
            )}
            <div className="figure-stats">
              <span>총 전송 이미지: {imageInputs.length}장</span>
              <span>프롬프트: ~{wc}단어</span>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="warnings-box">
              {warnings.map(
                (wId) =>
                  WARN_MESSAGES[wId] && (
                    <div key={wId} className="warn-item">
                      {WARN_MESSAGES[wId]}
                    </div>
                  ),
              )}
            </div>
          )}

          <div className="field">
            <div className="prompt-preview-header">
              <label>
                Final Prompt <span className="label-hint">(생성 전 직접 수정 가능)</span>
              </label>
              {promptEdited && (
                <button
                  type="button"
                  className="btn-minor"
                  onClick={() => {
                    updateActive({ finalPrompt: autoPrompt });
                    setPromptEdited(false);
                  }}
                >
                  자동 생성으로 되돌리기
                </button>
              )}
            </div>
            <textarea
              className="prompt-textarea"
              value={activeWork.finalPrompt || autoPrompt}
              onChange={(e) => {
                updateActive({ finalPrompt: resolveFigureRoleText(e.target.value, charA, charB) });
                setPromptEdited(true);
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                const cleaned = sanitizePrompt(pasted);
                if (cleaned && cleaned !== pasted) {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const nextValue = insertTextAtSelection(
                    activeWork.finalPrompt || autoPrompt,
                    cleaned,
                    el.selectionStart,
                    el.selectionEnd,
                  );
                  updateActive({ finalPrompt: resolveFigureRoleText(nextValue, charA, charB) });
                  setPromptEdited(true);
                }
              }}
              rows={10}
            />
            {promptEdited && <p className="mini warn">수동 수정됨 — compiledPrompt와 finalPrompt 모두 로그에 저장됩니다.</p>}
          </div>

          <div className="execution-panel">
            <div className="execution-status">{executionTargetLabel}</div>
            <div className="execution-actions">
              <button className="generate" onClick={startNewImage} disabled={activeWork.status === "running"}>
                {activeWork.status === "running" ? `${activeWork.batchProgress || "실행 중"} (${activeWork.elapsed}s)` : "New Image"}
              </button>
              <button className="edit-btn" onClick={editSelected} disabled={activeWork.status === "running"}>
                Edit Image
              </button>
            </div>
          </div>

          <div className="field">
            <label>
              User Memo <span className="label-hint">(생성 후 메모, 로그에 저장)</span>
            </label>
            <input
              value={activeWork.userMemo || ""}
              onChange={(e) => updateActiveField("userMemo", e.target.value)}
              placeholder="결과 인상, 프롬프트 실험 메모..."
            />
          </div>

          {activeWork.error && <pre className="error">{activeWork.error}</pre>}
          {!activeWork.error && activeWork.resultUrls.length === 0 && activeWork.status !== "running" && (
            <div className="empty">결과 이미지가 여기 표시됩니다.</div>
          )}
          {activeWork.status === "running" && <div className="empty">Seedream API 호출 중...</div>}

          <div className="results">
            {activeWork.resultUrls.map((url, i) => (
              <div key={i} className={"result-card" + (activeWork.selectedIndex === i ? " selected-card" : "")}>
                <button
                  className="select-result"
                  type="button"
                  onClick={() => updateActive({ selectedIndex: activeWork.selectedIndex === i ? null : i })}
                >
                  {activeWork.selectedIndex === i ? "Selected - click to clear" : `Select #${i + 1}`}
                </button>
                <div className="image-wrap">
                  <a href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`result ${i + 1}`} />
                  </a>
                </div>
                <button className="save-btn" type="button" onClick={() => downloadImage(url, `V21_W${activeWorkId}_${i + 1}.png`)}>
                  Save
                </button>
                {activeWork.selectedIndex === i && (
                  <div className="inline-edit-panel">
                    <div className="grid-header">
                      <span className="edit-upload-label">수정 영역 선택 (4x4)</span>
                      {selectedCells.length > 0 && <span className="selected-cells-label">{selectedCells.join(", ")}</span>}
                      {selectedCells.length > 0 && (
                        <button type="button" className="btn-minor" onClick={() => setSelectedCells([])}>
                          초기화
                        </button>
                      )}
                    </div>
                    <div className="grid-btn-group">
                      {["A", "B", "C", "D"].flatMap((r) =>
                        ["1", "2", "3", "4"].map((c) => {
                          const cell = `${r}${c}`;
                          return (
                            <button
                              key={cell}
                              type="button"
                              className={"grid-btn" + (selectedCells.includes(cell) ? " grid-btn-on" : "")}
                              onClick={() =>
                                setSelectedCells((prev) =>
                                  prev.includes(cell) ? prev.filter((x) => x !== cell) : [...prev, cell],
                                )
                              }
                            >
                              {cell}
                            </button>
                          );
                        }),
                      )}
                    </div>
                    <p className="mini edit-scope-note">수정 지시는 위 Final Prompt에 입력하고, 위쪽 Edit Image를 누르세요.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="external-edit-panel">
            <div className="grid-header">
              <span className="edit-upload-label">외부 이미지 빠른 수정</span>
              <span className="label-hint">이미지를 드롭한 뒤 Final Prompt에 수정 요청을 적고 위쪽 Edit Image를 누르세요.</span>
            </div>
            <div
              className={
                "edit-drop-zone" +
                (editImageDragging ? " edit-drop-zone-over" : "") +
                (editImagePreview ? " edit-drop-zone-filled" : "")
              }
              onDragOver={(e) => {
                e.preventDefault();
                setEditImageDragging(true);
              }}
              onDragLeave={() => setEditImageDragging(false)}
              onDrop={handleEditImageDrop}
              onClick={() => (document.getElementById("external-edit-file-input") as HTMLInputElement | null)?.click()}
            >
              {editImagePreview ? (
                <>
                  <img src={editImagePreview} className="edit-drop-preview" alt="edit target" />
                  <button
                    type="button"
                    className="edit-drop-clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditImagePreview("");
                    }}
                  >
                    x
                  </button>
                </>
              ) : (
                <div className="edit-drop-placeholder">
                  <span>외부 이미지 드롭</span>
                  <span className="edit-drop-hint">드롭존 이미지는 Edit Image의 1순위 수정 대상입니다.</span>
                </div>
              )}
            </div>
            <input
              id="external-edit-file-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleEditImageFile}
            />
            {editImagePreview && (
              <div className="button-row">
                <button type="button" className="btn-minor" onClick={() => setEditImagePreview("")}>
                  이미지 제거
                </button>
              </div>
            )}
          </div>

          {activeWork.rawResult ? (
            <details className="raw">
              <summary>Raw Response</summary>
              <pre>{JSON.stringify(activeWork.rawResult, null, 2)}</pre>
            </details>
          ) : null}
          {activeWork.lastEditPrompt && (
            <details className="raw" open>
              <summary>Last Edit Prompt (실제 전송)</summary>
              <pre>{activeWork.lastEditPrompt}</pre>
            </details>
          )}
          {activeWork.compiledPromptSnapshot && (
            <details className="raw">
              <summary>Auto-compiled Prompt (원본)</summary>
              <pre>{activeWork.compiledPromptSnapshot}</pre>
            </details>
          )}
        </section>
      </main>
    </div>
  );
}

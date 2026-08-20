import { createFileRoute } from "@tanstack/react-router";

import {
  callSeedream,
  extractUrls,
  makePayload,
  validateEnv,
} from "@/lib/seedream.server";

type Body = {
  prompt?: string;
  images?: string[];
  size?: string;
  aspectRatio?: string;
  watermark?: boolean;
  workId?: string;
  batchIndex?: number;
  generationId?: string;
  compiledPrompt?: string;
  finalPrompt?: string;
  logData?: unknown;
  refImages?: Record<string, string | null>;
};

const letters = "abcdefghijklmnopqrstuvwxyz";

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// Ark가 외부(서명) URL을 직접 내려받지 못하는 경우가 있어 서버에서 base64로 변환해 전달한다.
async function inlineImages(images?: string[]) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const out: string[] = [];
  for (const img of images) {
    if (typeof img !== "string" || !img.trim()) continue;
    if (!/^https?:\/\//i.test(img)) {
      out.push(img);
      continue;
    }
    try {
      const res = await fetch(img);
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "image/png";
      const b64 = toBase64(await res.arrayBuffer());
      out.push(`data:${type.split(";")[0]};base64,${b64}`);
    } catch (e) {
      console.error("reference image fetch failed", e);
    }
  }
  return out;
}

async function saveHistory(args: {
  raw: unknown;
  body: Body;
  apiSize: string;
}) {
  const { raw, body, apiSize } = args;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const workId = body.workId || "W1";
    const { data: counterData } = await supabaseAdmin.rpc("next_work_counter", { _work_id: workId });
    const counter = Number(counterData ?? 0);
    const padded = String(counter).padStart(5, "0");

    const urls = extractUrls(raw).filter((u) => u.startsWith("http"));
    const files: { path: string; filename: string }[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const filename = `V21_${workId}_${padded}${urls.length > 1 ? letters[i] || String(i) : ""}.png`;
        const path = `${workId}/${padded}/${filename}`;
        const up = await supabaseAdmin.storage
          .from("history")
          .upload(path, buf, { contentType: "image/png", upsert: true });
        if (!up.error) files.push({ path, filename });
      } catch (e) {
        console.error("history upload failed", e);
      }
    }

    await supabaseAdmin.from("generations").insert({
      counter,
      work_id: workId,
      batch_index: Number(body.batchIndex) || 0,
      aspect_ratio: body.aspectRatio ?? null,
      api_size: apiSize,
      input_image_count: (body.images || []).length,
      compiled_prompt: body.compiledPrompt ?? null,
      final_prompt: body.finalPrompt ?? null,
      sent_prompt: body.prompt ?? null,
      log_data: (body.logData ?? null) as never,
      result_files: files as never,
    });

    return { counter, files };
  } catch (e) {
    console.error("saveHistory failed", e);
    return null;
  }
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const envError = validateEnv();
          if (envError) return Response.json({ ok: false, error: envError }, { status: 500 });

          const body = (await request.json()) as Body;
          if (!body.prompt?.trim()) {
            return Response.json({ ok: false, error: "Prompt is required." }, { status: 400 });
          }

          const payload = makePayload({
            prompt: body.prompt,
            images: body.images,
            size: body.size ?? "2K",
            aspectRatio: body.aspectRatio,
            watermark: body.watermark ?? false,
          });

          const raw = await callSeedream(payload);
          const history = await saveHistory({ raw, body, apiSize: payload.size });
          return Response.json({ ok: true, raw, history });
        } catch (err) {
          const e = err as Error & { status?: number; detail?: unknown };
          return Response.json(
            { ok: false, error: e.message, detail: e.detail ?? null },
            { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 500 },
          );
        }
      },
    },
  },
});

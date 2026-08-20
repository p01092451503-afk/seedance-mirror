import { supabase } from "@/integrations/supabase/client";

export type LibImage = { filename: string; storagePath: string; url: string };
export type LibEntry = { id: string; displayName: string; images: LibImage[] };

const BUCKET = "references";
const SIGN_TTL = 60 * 60 * 6;

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGN_TTL);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export async function loadCharacters(): Promise<LibEntry[]> {
  const [{ data: chars, error: e1 }, { data: imgs, error: e2 }] = await Promise.all([
    supabase.from("characters").select("*").order("created_at", { ascending: true }),
    supabase.from("character_images").select("*").order("created_at", { ascending: true }),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const signed = await signPaths((imgs || []).map((i) => i.storage_path));
  return (chars || []).map((c) => ({
    id: c.id,
    displayName: c.display_name,
    images: (imgs || [])
      .filter((i) => i.character_id === c.id)
      .map((i) => ({ filename: i.filename, storagePath: i.storage_path, url: signed[i.storage_path] || "" })),
  }));
}

export async function loadStyles(): Promise<LibEntry[]> {
  const [{ data: rows, error: e1 }, { data: imgs, error: e2 }] = await Promise.all([
    supabase.from("styles").select("*").order("created_at", { ascending: true }),
    supabase.from("style_images").select("*").order("created_at", { ascending: true }),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const signed = await signPaths((imgs || []).map((i) => i.storage_path));
  return (rows || []).map((s) => ({
    id: s.id,
    displayName: s.display_name,
    images: (imgs || [])
      .filter((i) => i.style_id === s.id)
      .map((i) => ({ filename: i.filename, storagePath: i.storage_path, url: signed[i.storage_path] || "" })),
  }));
}

export async function createCharacterEntry(id: string, displayName: string) {
  const { error } = await supabase.from("characters").insert({ id, display_name: displayName });
  if (error) throw new Error(error.message);
}

export async function createStyleEntry(id: string, displayName: string) {
  const { error } = await supabase.from("styles").insert({ id, display_name: displayName });
  if (error) throw new Error(error.message);
}

export async function deleteStyleEntry(id: string) {
  const { data: imgs } = await supabase.from("style_images").select("storage_path").eq("style_id", id);
  if (imgs?.length) await supabase.storage.from(BUCKET).remove(imgs.map((i) => i.storage_path));
  const { error } = await supabase.from("styles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

export async function uploadLibraryImage(kind: "character" | "style", ownerId: string, file: File) {
  const filename = `${Date.now()}_${safeName(file.name)}`;
  const path = `${kind === "character" ? "characters" : "styles"}/${ownerId}/${filename}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/png", upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { error } =
    kind === "character"
      ? await supabase.from("character_images").insert({ character_id: ownerId, filename: file.name, storage_path: path })
      : await supabase.from("style_images").insert({ style_id: ownerId, filename: file.name, storage_path: path });
  if (error) throw new Error(error.message);
}

export async function deleteLibraryImage(kind: "character" | "style", storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } =
    kind === "character"
      ? await supabase.from("character_images").delete().eq("storage_path", storagePath)
      : await supabase.from("style_images").delete().eq("storage_path", storagePath);
  if (error) throw new Error(error.message);
}

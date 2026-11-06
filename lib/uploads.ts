import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// Deteksi tipe gambar dari isi file (magic bytes), bukan dari tipe kiriman klien
export function detectImage(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "webp";
  return null;
}

export async function saveImage(
  file: File,
  folder: string,
): Promise<{ path: string; url: string } | { error: "type" | "io" }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) return { error: "type" };

  const rel = `${folder}/${randomUUID()}.${ext}`;
  try {
    const target = path.join(UPLOAD_ROOT, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buf);
  } catch (e) {
    console.error("[uploads] save error:", e);
    return { error: "io" };
  }
  return { path: rel, url: `/uploads/${rel}` };
}

// Hapus file di public/uploads berdasarkan URL-nya. URL lain diabaikan.
export async function removeUploadedUrls(urls: (string | null | undefined)[]) {
  for (const u of new Set(urls)) {
    if (!u || !u.startsWith("/uploads/")) continue;
    try {
      const target = path.resolve(
        UPLOAD_ROOT,
        decodeURIComponent(u.slice("/uploads/".length)),
      );
      if (!target.startsWith(UPLOAD_ROOT + path.sep)) continue;
      await unlink(target);
    } catch {
      // file sudah tidak ada: tidak masalah
    }
  }
}